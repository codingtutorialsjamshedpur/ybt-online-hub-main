// Address related types
import { User } from '../types';

export interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  phone: string;
  country?: string;
  isDefault?: boolean;
}

// Function to convert simple address string to shipping address object
export function parseAddressString(addressString: string): ShippingAddress {
  if (!addressString) {
    return {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      phone: ""
    };
  }

  // Try to extract pincode/postal code using regex
  // Format like "jamshedpur-831001" or containing 6 digits together
  let postalCode = "";
  let city = "";
  
  // Look for standard Indian PIN code format (6 digits)
  const pincodeMatch = addressString.match(/\b(\d{6})\b/);
  if (pincodeMatch) {
    postalCode = pincodeMatch[1];
  }
  
  // Look for hyphenated format like "city-831001"
  const hyphenatedMatch = addressString.match(/([\w\s]+)-(\d{6})/i);
  if (hyphenatedMatch) {
    // If we found a city-pincode format
    city = hyphenatedMatch[1].trim();
    if (!postalCode) postalCode = hyphenatedMatch[2];
  }
  
  // If we still don't have a city, try to extract it from common comma-separated format
  if (!city) {
    // Split by comma and look for city names
    const parts = addressString.split(/,|\s/);
    
    // Common city indicators that might be in the address
    const cityKeywords = [
      'jamshedpur', 'sakchi', 'ranchi', 'dhanbad', 'bokaro', 'kolkata',
      'delhi', 'mumbai', 'bangalore', 'chennai', 'hyderabad', 'pune', 'ahmedabad'
    ];
    
    // Find first matching city in address parts
    for (const part of parts) {
      const normalizedPart = part.toLowerCase().trim();
      if (normalizedPart && cityKeywords.includes(normalizedPart)) {
        city = normalizedPart;
        // Capitalize first letter
        city = city.charAt(0).toUpperCase() + city.slice(1);
        break;
      }
    }
    
    // If still no city found, take the second last part as city as a fallback
    // This is based on the common format: street, area, city, state, pincode
    if (!city && parts.length > 2) {
      // Try to find a part that's not a number and not too short
      for (let i = parts.length - 2; i >= 0; i--) {
        const potentialCity = parts[i].trim();
        if (potentialCity && potentialCity.length > 3 && !/^\d+$/.test(potentialCity)) {
          city = potentialCity;
          // Capitalize first letter
          city = city.charAt(0).toUpperCase() + city.slice(1);
          break;
        }
      }
    }
  }

  return {
    name: "",
    address: addressString,
    city: city || "Not extracted",
    postalCode: postalCode || "Not extracted",
    phone: ""
  };
}

// Function to parse user profile address to shipping address
export function getUserShippingAddress(user: any): ShippingAddress | undefined {
  if (!user) return undefined;
  
  // If user already has structured shipping address
  if (user.shippingAddress && typeof user.shippingAddress === 'object') {
    return user.shippingAddress as ShippingAddress;
  }
  
  // If user has simple address string
  if (user.address && typeof user.address === 'string') {
    // Parse the address string to extract city and postal code
    const parsedAddress = parseAddressString(user.address);
    
    return {
      name: user.name || user.displayName || user.fullName || "",
      address: user.address,
      city: parsedAddress.city,
      postalCode: parsedAddress.postalCode,
      phone: user.phone || "",
    };
  }

  // No address found
  return undefined;
}
