// (Formatting, Icon logic)
import { 
    Wallet, Receipt, Car, ShoppingBag, PartyPopper, Heart, 
    CircleDollarSign, ShoppingCart, Utensils, PiggyBank, ShieldCheck 
  } from 'lucide-react';
  
  export const toSentenceCase = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };
  
  export const getCategoryIcon = (catName) => {
    const lower = catName?.toLowerCase() || '';
    if (lower.includes('grocer') || lower.includes('food')) return ShoppingCart;
    if (lower.includes('eat') || lower.includes('restaurant')) return Utensils;
    if (lower.includes('transport') || lower.includes('fuel') || lower.includes('car')) return Car;
    if (lower.includes('shop') || lower.includes('cloth')) return ShoppingBag;
    if (lower.includes('leisure') || lower.includes('event') || lower.includes('party')) return PartyPopper;
    if (lower.includes('health') || lower.includes('beauty') || lower.includes('gym')) return Heart;
    if (lower.includes('bill') || lower.includes('rent')) return Receipt;
    if (lower.includes('income') || lower.includes('salary')) return Wallet;
    if (lower.includes('saving') || lower.includes('invest') || lower.includes('fund')) return PiggyBank;
    if (lower.includes('emergency')) return ShieldCheck;
    return CircleDollarSign;
  };