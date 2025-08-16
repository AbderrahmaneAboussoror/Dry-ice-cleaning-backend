import {getDateType} from "../utils/dateUtils";

export type ServiceType = 'basic' | 'deluxe';

interface PricingConfig {
    basic: number;
    deluxe: number;
    weekendMultiplier: number;
    holidayMultiplier: number;
}

const PRICING_CONFIG: PricingConfig = {
    basic: 1000,
    deluxe: 1400,
    weekendMultiplier: 1.5,  // +50%
    holidayMultiplier: 2.0   // +100%
};

export const calculateAppointmentPrice = (serviceType: ServiceType, appointmentDate: Date): number => {
    const basePrice = PRICING_CONFIG[serviceType];
    const dateType = getDateType(appointmentDate);

    switch (dateType) {
        case 'weekend':
            return Math.round(basePrice * PRICING_CONFIG.weekendMultiplier);
        case 'holiday':
            return Math.round(basePrice * PRICING_CONFIG.holidayMultiplier);
        default:
            return basePrice;
    }
};

export const getPriceBreakdown = (serviceType: ServiceType, appointmentDate: Date) => {
    const basePrice = PRICING_CONFIG[serviceType];
    const dateType = getDateType(appointmentDate);
    const finalPrice = calculateAppointmentPrice(serviceType, appointmentDate);

    let surcharge = 0;
    let surchargeType = '';

    if (dateType === 'weekend') {
        surcharge = finalPrice - basePrice;
        surchargeType = 'Weekend Surcharge (+50%)';
    } else if (dateType === 'holiday') {
        surcharge = finalPrice - basePrice;
        surchargeType = 'Holiday Surcharge (+100%)';
    }

    return {
        basePrice,
        surcharge,
        surchargeType,
        finalPrice,
        dateType
    };
};