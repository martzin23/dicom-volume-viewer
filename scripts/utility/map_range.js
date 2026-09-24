
export function mapRange(value, fromMin, fromMax, toMin, toMax, clamp = false) {
    if (Math.abs(fromMax - fromMin) < Number.EPSILON)
        return toMin;
    
    let result = ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
    
    if (clamp)
        result = Math.max(Math.min(result, toMax), toMin);
    
    return result;
}