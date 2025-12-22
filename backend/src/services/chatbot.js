const { Op } = require('sequelize');
const { Vehicle, Appointment, Customer } = require('../models');
const evolutionService = require('./evolution');
const logger = require('../config/logger');

// Chat states
const STATES = {
    IDLE: 'idle',
    MAIN_MENU: 'main_menu',
    VEHICLE_SEARCH: 'vehicle_search',
    VEHICLE_BRAND: 'vehicle_brand',
    VEHICLE_TYPE: 'vehicle_type',
    VEHICLE_RESULTS: 'vehicle_results',
    VEHICLE_DETAIL: 'vehicle_detail',
    APPOINTMENT_START: 'appointment_start',
    APPOINTMENT_NAME: 'appointment_name',
    APPOINTMENT_DATE: 'appointment_date',
    APPOINTMENT_TIME: 'appointment_time',
    APPOINTMENT_CONFIRM: 'appointment_confirm'
};

// Business info
const BUSINESS_INFO = {
    name: 'M. Cangil Auto Trading Ltd.',
    owner: 'Mustafa Cangil',
    phones: ['+905338551166', '+905488889716'],
    address: 'Girne / Alsancak, Kuzey Kıbrıs',
    hours: 'Pazartesi - Cumartesi: 09:00 - 18:00'
};

/**
 * Main message handler
 */
async function handleMessage(phone, message) {
    try {
        // Get or create customer
        let customer = await Customer.findOne({ where: { phone } });

        if (!customer) {
            customer = await Customer.create({
                phone,
                chatState: { state: STATES.IDLE }
            });
        }

        // Update interaction
        await customer.update({
            lastInteraction: new Date(),
            totalMessages: customer.totalMessages + 1
        });

        const state = customer.chatState?.state || STATES.IDLE;
        const text = message.toLowerCase().trim();

        // Handle menu shortcuts
        if (text === '0' || text === 'ana menü' || text === 'menu') {
            return await showMainMenu(phone, customer);
        }

        // Route based on state
        switch (state) {
            case STATES.IDLE:
                return await showWelcome(phone, customer);

            case STATES.MAIN_MENU:
                return await handleMainMenu(phone, text, customer);

            case STATES.VEHICLE_BRAND:
                return await handleBrandSelection(phone, text, customer);

            case STATES.VEHICLE_TYPE:
                return await handleTypeSelection(phone, text, customer);

            case STATES.VEHICLE_RESULTS:
                return await handleVehicleResults(phone, text, customer);

            case STATES.VEHICLE_DETAIL:
                return await handleVehicleDetail(phone, text, customer);

            case STATES.APPOINTMENT_NAME:
                return await handleAppointmentName(phone, message, customer);

            case STATES.APPOINTMENT_DATE:
                return await handleAppointmentDate(phone, text, customer);

            case STATES.APPOINTMENT_TIME:
                return await handleAppointmentTime(phone, text, customer);

            case STATES.APPOINTMENT_CONFIRM:
                return await handleAppointmentConfirm(phone, text, customer);

            default:
                return await showWelcome(phone, customer);
        }
    } catch (error) {
        logger.error('Error handling message:', error);
        await evolutionService.sendMessage(phone,
            '❌ Bir hata oluştu. Lütfen tekrar deneyin veya ' +
            `${BUSINESS_INFO.phones[0]} numarasını arayın.`
        );
    }
}

/**
 * Show welcome message
 */
async function showWelcome(phone, customer) {
    const welcomeMessage =
        `🚗 *${BUSINESS_INFO.name}* 'a hoş geldiniz!\n\n` +
        `Merhaba! Size nasıl yardımcı olabilirim?\n\n` +
        `1️⃣ Araç Ara\n` +
        `2️⃣ Randevu Al\n` +
        `3️⃣ İletişim Bilgileri\n\n` +
        `_Seçiminizi yazın (1, 2 veya 3)_`;

    await customer.update({
        chatState: { state: STATES.MAIN_MENU }
    });

    return await evolutionService.sendMessage(phone, welcomeMessage);
}

/**
 * Show main menu
 */
async function showMainMenu(phone, customer) {
    const menuMessage =
        `📋 *Ana Menü*\n\n` +
        `1️⃣ Araç Ara\n` +
        `2️⃣ Randevu Al\n` +
        `3️⃣ İletişim Bilgileri\n\n` +
        `_Seçiminizi yazın_`;

    await customer.update({
        chatState: { state: STATES.MAIN_MENU }
    });

    return await evolutionService.sendMessage(phone, menuMessage);
}

/**
 * Handle main menu selection
 */
async function handleMainMenu(phone, text, customer) {
    switch (text) {
        case '1':
        case 'araç':
        case 'arac':
        case 'ara':
            return await showVehicleBrands(phone, customer);

        case '2':
        case 'randevu':
            return await startAppointment(phone, customer);

        case '3':
        case 'iletişim':
        case 'iletisim':
            return await showContactInfo(phone, customer);

        default:
            // Try to search by text
            if (text.length > 2) {
                return await searchVehicles(phone, text, customer);
            }
            return await showMainMenu(phone, customer);
    }
}

/**
 * Show available brands
 */
async function showVehicleBrands(phone, customer) {
    const vehicles = await Vehicle.findAll({
        where: { status: 'active' },
        attributes: ['brand'],
        group: ['brand'],
        order: [['brand', 'ASC']]
    });

    const brands = vehicles.map(v => v.brand);

    if (brands.length === 0) {
        await evolutionService.sendMessage(phone,
            '😔 Şu anda stokta araç bulunmamaktadır.\n\n' +
            '0 ile ana menüye dönebilirsiniz.'
        );
        return;
    }

    let message = `🚗 *Marka Seçin*\n\n`;
    brands.forEach((brand, i) => {
        message += `${i + 1}. ${brand}\n`;
    });
    message += `\n_Marka numarasını yazın veya marka adını yazın_\n`;
    message += `_0 - Ana Menü_`;

    await customer.update({
        chatState: {
            state: STATES.VEHICLE_BRAND,
            brands: brands
        }
    });

    return await evolutionService.sendMessage(phone, message);
}

/**
 * Handle brand selection
 */
async function handleBrandSelection(phone, text, customer) {
    const brands = customer.chatState?.brands || [];
    let selectedBrand;

    // Check if number
    const num = parseInt(text);
    if (!isNaN(num) && num > 0 && num <= brands.length) {
        selectedBrand = brands[num - 1];
    } else {
        // Try to match brand name
        selectedBrand = brands.find(b =>
            b.toLowerCase().includes(text.toLowerCase())
        );
    }

    if (!selectedBrand) {
        return await evolutionService.sendMessage(phone,
            '❌ Geçersiz seçim. Lütfen listeden bir marka numarası yazın.'
        );
    }

    // Show body types for this brand
    const vehicles = await Vehicle.findAll({
        where: {
            brand: selectedBrand,
            status: 'active'
        },
        attributes: ['bodyType'],
        group: ['bodyType']
    });

    const types = vehicles.map(v => v.bodyType).filter(Boolean);

    if (types.length <= 1) {
        // Skip type selection, show results directly
        return await showVehicleResults(phone, selectedBrand, null, customer);
    }

    let message = `🚗 *${selectedBrand} - Araç Tipi Seçin*\n\n`;
    const typeNames = {
        'sedan': 'Sedan',
        'hatchback': 'Hatchback',
        'suv': 'SUV',
        'pickup': 'Pick-up',
        'minivan': 'Minivan',
        'coupe': 'Coupe',
        'cabrio': 'Cabrio',
        'panelvan': 'Panelvan'
    };

    types.forEach((type, i) => {
        message += `${i + 1}. ${typeNames[type] || type}\n`;
    });
    message += `\n${types.length + 1}. Tümünü Göster\n`;
    message += `_0 - Ana Menü_`;

    await customer.update({
        chatState: {
            state: STATES.VEHICLE_TYPE,
            brand: selectedBrand,
            types: types
        }
    });

    return await evolutionService.sendMessage(phone, message);
}

/**
 * Handle type selection
 */
async function handleTypeSelection(phone, text, customer) {
    const { brand, types } = customer.chatState || {};
    let selectedType = null;

    const num = parseInt(text);
    if (num === types.length + 1) {
        // Show all
        selectedType = null;
    } else if (!isNaN(num) && num > 0 && num <= types.length) {
        selectedType = types[num - 1];
    }

    return await showVehicleResults(phone, brand, selectedType, customer);
}

/**
 * Show vehicle results
 */
async function showVehicleResults(phone, brand, bodyType, customer) {
    const where = { status: 'active' };
    if (brand) where.brand = brand;
    if (bodyType) where.bodyType = bodyType;

    const vehicles = await Vehicle.findAll({
        where,
        order: [['year', 'DESC']],
        limit: 10
    });

    if (vehicles.length === 0) {
        await evolutionService.sendMessage(phone,
            '😔 Bu kriterlere uygun araç bulunamadı.\n\n' +
            '0 ile ana menüye dönebilirsiniz.'
        );
        return;
    }

    let message = `🔍 *Arama Sonuçları* (${vehicles.length} araç)\n\n`;

    vehicles.forEach((v, i) => {
        message += `*${i + 1}. ${v.year} ${v.brand} ${v.model}*\n`;
        if (v.color) message += `   📍 ${v.color}`;
        if (v.transmission) message += ` | ${v.transmission === 'otomatik' ? 'Otomatik' : 'Manuel'}`;
        if (v.mileage) message += ` | ${v.mileage.toLocaleString()} km`;
        message += `\n`;
        if (v.price) {
            message += `   💰 ${v.price.toLocaleString()} ₺\n`;
        } else {
            message += `   💰 Fiyat için arayınız\n`;
        }
        message += `\n`;
    });

    message += `_Detay için araç numarasını yazın_\n`;
    message += `_0 - Ana Menü_`;

    await customer.update({
        chatState: {
            state: STATES.VEHICLE_RESULTS,
            vehicles: vehicles.map(v => v.id)
        }
    });

    return await evolutionService.sendMessage(phone, message);
}

/**
 * Handle vehicle result selection
 */
async function handleVehicleResults(phone, text, customer) {
    const vehicleIds = customer.chatState?.vehicles || [];
    const num = parseInt(text);

    if (isNaN(num) || num < 1 || num > vehicleIds.length) {
        return await evolutionService.sendMessage(phone,
            '❌ Geçersiz seçim. Lütfen listeden bir araç numarası yazın.'
        );
    }

    const vehicleId = vehicleIds[num - 1];
    const vehicle = await Vehicle.findByPk(vehicleId);

    if (!vehicle) {
        return await showMainMenu(phone, customer);
    }

    let message = `🚗 *${vehicle.year} ${vehicle.brand} ${vehicle.model}*\n\n`;

    if (vehicle.color) message += `🎨 Renk: ${vehicle.color}\n`;
    if (vehicle.transmission) message += `⚙️ Vites: ${vehicle.transmission === 'otomatik' ? 'Otomatik' : 'Manuel'}\n`;
    if (vehicle.fuelType) message += `⛽ Yakıt: ${vehicle.fuelType.charAt(0).toUpperCase() + vehicle.fuelType.slice(1)}\n`;
    if (vehicle.mileage) message += `📊 Kilometre: ${vehicle.mileage.toLocaleString()} km\n`;
    if (vehicle.price) {
        message += `💰 Fiyat: ${vehicle.price.toLocaleString()} ₺\n`;
    } else {
        message += `💰 Fiyat: Görüşmek için arayınız\n`;
    }

    if (vehicle.description) {
        message += `\n📝 ${vehicle.description}\n`;
    }

    message += `\n────────────────────\n`;
    message += `1️⃣ Bu araç için randevu al\n`;
    message += `2️⃣ Bizi arayın: ${BUSINESS_INFO.phones[0]}\n`;
    message += `0️⃣ Ana Menü\n`;

    await customer.update({
        chatState: {
            state: STATES.VEHICLE_DETAIL,
            vehicleId: vehicleId
        }
    });

    // Send image if available
    if (vehicle.images && vehicle.images.length > 0) {
        await evolutionService.sendImage(phone, vehicle.images[0], message);
    } else {
        await evolutionService.sendMessage(phone, message);
    }
}

/**
 * Handle vehicle detail actions
 */
async function handleVehicleDetail(phone, text, customer) {
    if (text === '1' || text.includes('randevu')) {
        return await startAppointment(phone, customer);
    }
    return await showMainMenu(phone, customer);
}

/**
 * Search vehicles by text
 */
async function searchVehicles(phone, searchText, customer) {
    const vehicles = await Vehicle.findAll({
        where: {
            status: 'active',
            [Op.or]: [
                { brand: { [Op.iLike]: `%${searchText}%` } },
                { model: { [Op.iLike]: `%${searchText}%` } }
            ]
        },
        limit: 10
    });

    if (vehicles.length === 0) {
        await evolutionService.sendMessage(phone,
            `🔍 "${searchText}" için sonuç bulunamadı.\n\n` +
            `Ana menüye dönmek için 0 yazın.`
        );
        return;
    }

    return await showVehicleResults(phone, null, null, customer);
}

/**
 * Start appointment flow
 */
async function startAppointment(phone, customer) {
    await customer.update({
        chatState: {
            state: STATES.APPOINTMENT_NAME,
            vehicleId: customer.chatState?.vehicleId
        }
    });

    return await evolutionService.sendMessage(phone,
        `📅 *Randevu Oluştur*\n\n` +
        `Lütfen adınızı ve soyadınızı yazın:\n\n` +
        `_0 - Ana Menü_`
    );
}

/**
 * Handle appointment name
 */
async function handleAppointmentName(phone, name, customer) {
    if (name.length < 3) {
        return await evolutionService.sendMessage(phone,
            '❌ Lütfen geçerli bir isim girin.'
        );
    }

    // Get available dates (next 7 days excluding Sunday)
    const dates = [];
    const today = new Date();

    for (let i = 1; i <= 14 && dates.length < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Skip Sundays (0)
        if (date.getDay() !== 0) {
            dates.push({
                date: date.toISOString().split('T')[0],
                display: date.toLocaleDateString('tr-TR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                })
            });
        }
    }

    let message = `📅 *Tarih Seçin*\n\n`;
    dates.forEach((d, i) => {
        message += `${i + 1}. ${d.display}\n`;
    });
    message += `\n_Tarih numarasını yazın_\n`;
    message += `_0 - Ana Menü_`;

    await customer.update({
        name: name,
        chatState: {
            ...customer.chatState,
            state: STATES.APPOINTMENT_DATE,
            customerName: name,
            availableDates: dates
        }
    });

    return await evolutionService.sendMessage(phone, message);
}

/**
 * Handle appointment date selection
 */
async function handleAppointmentDate(phone, text, customer) {
    const dates = customer.chatState?.availableDates || [];
    const num = parseInt(text);

    if (isNaN(num) || num < 1 || num > dates.length) {
        return await evolutionService.sendMessage(phone,
            '❌ Geçersiz seçim. Lütfen listeden bir tarih numarası yazın.'
        );
    }

    const selectedDate = dates[num - 1];

    // Get available time slots
    const bookedAppointments = await Appointment.findAll({
        where: {
            appointmentDate: selectedDate.date,
            status: { [Op.notIn]: ['cancelled'] }
        },
        attributes: ['appointmentTime']
    });

    const allSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
        '16:00', '16:30', '17:00', '17:30'
    ];

    const bookedTimes = bookedAppointments.map(a =>
        a.appointmentTime.substring(0, 5)
    );

    const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot));

    if (availableSlots.length === 0) {
        return await evolutionService.sendMessage(phone,
            `❌ ${selectedDate.display} tarihinde müsait saat bulunmamaktadır.\n` +
            `Lütfen başka bir tarih seçin.`
        );
    }

    let message = `⏰ *Saat Seçin* - ${selectedDate.display}\n\n`;
    availableSlots.forEach((slot, i) => {
        message += `${i + 1}. ${slot}\n`;
    });
    message += `\n_Saat numarasını yazın_\n`;
    message += `_0 - Ana Menü_`;

    await customer.update({
        chatState: {
            ...customer.chatState,
            state: STATES.APPOINTMENT_TIME,
            selectedDate: selectedDate,
            availableSlots: availableSlots
        }
    });

    return await evolutionService.sendMessage(phone, message);
}

/**
 * Handle appointment time selection
 */
async function handleAppointmentTime(phone, text, customer) {
    const slots = customer.chatState?.availableSlots || [];
    const num = parseInt(text);

    if (isNaN(num) || num < 1 || num > slots.length) {
        return await evolutionService.sendMessage(phone,
            '❌ Geçersiz seçim. Lütfen listeden bir saat numarası yazın.'
        );
    }

    const selectedTime = slots[num - 1];
    const { customerName, selectedDate, vehicleId } = customer.chatState;

    // Get vehicle info if selected
    let vehicleInfo = '';
    if (vehicleId) {
        const vehicle = await Vehicle.findByPk(vehicleId);
        if (vehicle) {
            vehicleInfo = `🚗 Araç: ${vehicle.year} ${vehicle.brand} ${vehicle.model}\n`;
        }
    }

    let message = `📋 *Randevu Özeti*\n\n`;
    message += `👤 İsim: ${customerName}\n`;
    message += `📅 Tarih: ${selectedDate.display}\n`;
    message += `⏰ Saat: ${selectedTime}\n`;
    if (vehicleInfo) message += vehicleInfo;
    message += `📍 Adres: ${BUSINESS_INFO.address}\n\n`;
    message += `Bu bilgiler doğru mu?\n\n`;
    message += `1️⃣ Evet, onayla\n`;
    message += `2️⃣ Hayır, iptal et\n`;

    await customer.update({
        chatState: {
            ...customer.chatState,
            state: STATES.APPOINTMENT_CONFIRM,
            selectedTime: selectedTime
        }
    });

    return await evolutionService.sendMessage(phone, message);
}

/**
 * Handle appointment confirmation
 */
async function handleAppointmentConfirm(phone, text, customer) {
    if (text === '2' || text.includes('iptal') || text.includes('hayır')) {
        await evolutionService.sendMessage(phone,
            '❌ Randevu iptal edildi.\n\n' +
            '0 ile ana menüye dönebilirsiniz.'
        );
        return await showMainMenu(phone, customer);
    }

    if (text !== '1' && !text.includes('evet') && !text.includes('onayla')) {
        return await evolutionService.sendMessage(phone,
            '❌ Lütfen 1 (Evet) veya 2 (Hayır) yazın.'
        );
    }

    const { customerName, selectedDate, selectedTime, vehicleId } = customer.chatState;

    // Create appointment
    const appointment = await Appointment.create({
        customerName,
        customerPhone: phone,
        vehicleId: vehicleId || null,
        appointmentDate: selectedDate.date,
        appointmentTime: selectedTime,
        status: 'pending',
        source: 'whatsapp'
    });

    let message = `✅ *Randevunuz Alınmıştır!*\n\n`;
    message += `📋 Randevu No: ${appointment.id.substring(0, 8).toUpperCase()}\n`;
    message += `📅 Tarih: ${selectedDate.display}\n`;
    message += `⏰ Saat: ${selectedTime}\n`;
    message += `📍 Adres: ${BUSINESS_INFO.address}\n\n`;
    message += `Değişiklik için ${BUSINESS_INFO.phones[0]} numarasını arayabilirsiniz.\n\n`;
    message += `Bizi tercih ettiğiniz için teşekkür ederiz! 🙏`;

    await customer.update({
        chatState: { state: STATES.IDLE }
    });

    return await evolutionService.sendMessage(phone, message);
}

/**
 * Show contact info
 */
async function showContactInfo(phone, customer) {
    const message =
        `📞 *İletişim Bilgileri*\n\n` +
        `🏢 ${BUSINESS_INFO.name}\n` +
        `👤 ${BUSINESS_INFO.owner}\n\n` +
        `📱 ${BUSINESS_INFO.phones[0]}\n` +
        `📱 ${BUSINESS_INFO.phones[1]}\n\n` +
        `📍 ${BUSINESS_INFO.address}\n\n` +
        `🕐 ${BUSINESS_INFO.hours}\n\n` +
        `_0 - Ana Menü_`;

    await customer.update({
        chatState: { state: STATES.MAIN_MENU }
    });

    return await evolutionService.sendMessage(phone, message);
}

module.exports = {
    handleMessage,
    STATES
};
