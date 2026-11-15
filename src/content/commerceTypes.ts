export type BusinessKind='auto'|'beauty'|'cafe'|'shop'|'service';
export type DesignStyle='minimal'|'modern'|'dark-premium';
export type SiteKind='landing'|'business-card'|'corporate'|'catalogue'|'design'|'improve';
export interface DesignSelection {business:BusinessKind;style:DesignStyle;palette:string}
export interface OrderDraft extends Partial<DesignSelection> {siteType?:SiteKind;businessName?:string;features?:string[];notes?:string;contactMethod?:'instagram'|'whatsapp'}
