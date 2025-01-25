export const formatIndianCurrency = (amount: number): string => {
  // Handle null, undefined, or invalid input
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00';
  }

  // Convert to 2 decimal places
  const fixedAmount = amount.toFixed(2);
  
  // Split into whole and decimal parts
  const [wholePart, decimalPart] = fixedAmount.split('.');
  
  // Format whole part according to Indian numbering system
  const lastThree = wholePart.substring(wholePart.length - 3);
  const otherNumbers = wholePart.substring(0, wholePart.length - 3);
  const formattedWholePart = otherNumbers 
    ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree 
    : lastThree;
    
  // Return formatted string with ₹ symbol
  return `₹${formattedWholePart}.${decimalPart}`;
}; 