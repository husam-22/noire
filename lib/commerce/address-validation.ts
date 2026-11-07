import type { Address, AddressValidationResult } from '@/types';

const REQUIRED_FIELDS: Array<keyof Address> = ['firstName', 'lastName', 'line1', 'city', 'postalCode', 'country', 'phone'];

/** Structural address checks shared by the checkout UI, server actions and the account address book. */
export function validateAddress(address: Partial<Address>): AddressValidationResult {
  const fieldErrors: NonNullable<AddressValidationResult['fieldErrors']> = {};
  for (const field of REQUIRED_FIELDS) {
    if (!String(address[field] ?? '').trim()) {
      fieldErrors[field] = 'This field is required.';
    }
  }

  const country = String(address.country ?? '').trim();
  const postal = String(address.postalCode ?? '').trim();
  if (/^(us|usa|united states)$/i.test(country) && postal && !/^\d{5}(?:-\d{4})?$/.test(postal)) {
    fieldErrors.postalCode = 'Enter a valid five-digit US ZIP code (or ZIP+4).';
  }

  const phoneDigits = String(address.phone ?? '').replace(/\D/g, '');
  if (phoneDigits && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
    fieldErrors.phone = 'Enter an international phone number with 7–15 digits.';
  }

  const valid = Object.keys(fieldErrors).length === 0;
  return {
    valid,
    message: valid ? 'Address is complete.' : 'Some address details need attention.',
    fieldErrors: valid ? undefined : fieldErrors,
  };
}
