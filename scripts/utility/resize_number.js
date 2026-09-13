
export default function resizeNumber(number, size = 7) {
    const digits = number.toString().replace(".","").length;
    const decimals = number.toString().split(".")[1] ? number.toString().split(".")[1].length : 0;
    const delta = digits > size ? decimals - (digits - size) : decimals;
    return number.toFixed(delta); 
}
