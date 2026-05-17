import { enAU } from "./enAU.js";
import { koKR } from "./koKR.js";

export function getCopyForLocale(locale) {
  if (locale === "ko-KR") {
    return koKR;
  }
  
  return enAU;
}
