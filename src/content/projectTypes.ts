export type ShowcaseStatus = 'studio'|'collection'|'prototype'|'demo'|'concept'|'owner_review_needed'|'education';
export interface PortfolioProject {
  id:string; name:string; category:string; status:ShowcaseStatus; summary:string;
  url:string; alternateUrls:string[];
  thumbnail?:string; previewImage?:string; verified:boolean;
  verification:{state:'ok'|'unavailable'|'restricted'; httpStatus:number|null; checkedAt:string; finalUrl:string; note?:string};
}
