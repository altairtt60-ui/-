import type { PortfolioProject } from './projectTypes';

// Public availability and screenshot provenance are separate from editorial/client status.
// Four concept statuses were explicitly confirmed by the owner after the source inventory.
export const projects:PortfolioProject[] = [
  {
    "id": "altweb-portfolio",
    "name": "Altweb — портфолио",
    "category": "studio",
    "status": "studio",
    "summary": "Существующее портфолио Altweb Design.",
    "url": "https://altweb-portfolio.vercel.app/",
    "alternateUrls": [
      "https://altweb.altairtt60.chatgpt.site/"
    ],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:10.151Z",
      "finalUrl": "https://altweb-portfolio.vercel.app/"
    },
    "thumbnail": "/projects/altweb-portfolio-thumb.webp",
    "previewImage": "/projects/altweb-portfolio-preview.webp"
  },
  {
    "id": "altweb-atelier",
    "name": "Altweb Atelier",
    "category": "studio",
    "status": "collection",
    "summary": "Подборка демонстрационных сайтов Altweb.",
    "url": "https://altweb-atelier.vercel.app/",
    "alternateUrls": [
      "https://atelier-business-demos.altairtt60.chatgpt.site/"
    ],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:12.939Z",
      "finalUrl": "https://altweb-atelier.vercel.app/bakery/",
      "note": "Главный адрес перенаправляет на /bakery/; превью снято с фактически открывшейся страницы."
    },
    "thumbnail": "/projects/altweb-atelier-thumb.webp",
    "previewImage": "/projects/altweb-atelier-preview.webp"
  },
  {
    "id": "altweb-design",
    "name": "Altweb Design — услуги",
    "category": "studio",
    "status": "studio",
    "summary": "Сайт Altweb Design с описанием услуг.",
    "url": "https://altweb-design.altairtt60.chatgpt.site/",
    "alternateUrls": [],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:16.900Z",
      "finalUrl": "https://altweb-design.altairtt60.chatgpt.site/"
    },
    "thumbnail": "/projects/altweb-design-thumb.webp",
    "previewImage": "/projects/altweb-design-preview.webp"
  },
  {
    "id": "altweb-playground",
    "name": "Altweb Playground",
    "category": "experimental",
    "status": "prototype",
    "summary": "Ранний эксперимент с интерактивным портфолио; не финальная Altweb Factory.",
    "url": "https://altweb-playground-2026.altairtt60.chatgpt.site/",
    "alternateUrls": [],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:20.370Z",
      "finalUrl": "https://altweb-playground-2026.altairtt60.chatgpt.site/"
    },
    "thumbnail": "/projects/altweb-playground-thumb.webp",
    "previewImage": "/projects/altweb-playground-preview.webp"
  },
  {
    "id": "pitlane-auto",
    "name": "PITLANE Auto",
    "category": "auto",
    "status": "demo",
    "summary": "Демонстрационный сайт автосервиса.",
    "url": "https://pitlane-auto.vercel.app/",
    "alternateUrls": [
      "https://pitlane-auto-service.altairtt60.chatgpt.site/"
    ],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:23.074Z",
      "finalUrl": "https://pitlane-auto.vercel.app/"
    },
    "thumbnail": "/projects/pitlane-auto-thumb.webp",
    "previewImage": "/projects/pitlane-auto-preview.webp"
  },
  {
    "id": "kn-detailing",
    "name": "KN Detailing",
    "category": "auto",
    "status": "concept",
    "summary": "Концепт сайта студии детейлинга.",
    "url": "https://kn-detailing-studio.vercel.app/",
    "alternateUrls": [],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:26.511Z",
      "finalUrl": "https://kn-detailing-studio.vercel.app/"
    },
    "thumbnail": "/projects/kn-detailing-thumb.webp",
    "previewImage": "/projects/kn-detailing-preview.webp"
  },
  {
    "id": "avtozabota-detailing",
    "name": "Avtozabota Detailing",
    "category": "auto",
    "status": "demo",
    "summary": "Адаптируемый демонстрационный сайт детейлинга.",
    "url": "https://avtozabota-detailing-demo.vercel.app/",
    "alternateUrls": [],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:29.239Z",
      "finalUrl": "https://avtozabota-detailing-demo.vercel.app/"
    },
    "thumbnail": "/projects/avtozabota-detailing-thumb.webp",
    "previewImage": "/projects/avtozabota-detailing-preview.webp"
  },
  {
    "id": "gaziza",
    "name": "GAZIZA",
    "category": "beauty",
    "status": "concept",
    "summary": "Концепт сайта в бьюти-сфере.",
    "url": "https://gaziza-almaty.vercel.app/",
    "alternateUrls": [
      "https://gaziza-almaty.altairtt60.chatgpt.site/"
    ],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:32.661Z",
      "finalUrl": "https://gaziza-almaty.vercel.app/"
    },
    "thumbnail": "/projects/gaziza-thumb.webp",
    "previewImage": "/projects/gaziza-preview.webp"
  },
  {
    "id": "nogti-mania",
    "name": "Nogti Mania",
    "category": "beauty",
    "status": "concept",
    "summary": "Концепт сайта студии маникюра.",
    "url": "https://nogti-mania-almaty.vercel.app/",
    "alternateUrls": [
      "https://nogti-mania-almaty.altairtt60.chatgpt.site/"
    ],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:35.905Z",
      "finalUrl": "https://nogti-mania-almaty.vercel.app/"
    },
    "thumbnail": "/projects/nogti-mania-thumb.webp",
    "previewImage": "/projects/nogti-mania-preview.webp"
  },
  {
    "id": "dans-le-garage",
    "name": "Dans Le Garage",
    "category": "beauty",
    "status": "concept",
    "summary": "Концепт сайта клуба красоты.",
    "url": "https://www.danslegarage.com/",
    "alternateUrls": [
      "https://dans-le-garage-club.vercel.app/",
      "https://dans-le-garage-club.altairtt60.chatgpt.site/"
    ],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:41.290Z",
      "finalUrl": "https://dans-le-garage-club.vercel.app/",
      "note": "Канонический адрес не открылся в этой среде; проверен предоставленный альтернативный адрес."
    },
    "thumbnail": "/projects/dans-le-garage-thumb.webp",
    "previewImage": "/projects/dans-le-garage-preview.webp"
  },
  {
    "id": "chb-barbershop",
    "name": "ЧБ Barbershop",
    "category": "beauty",
    "status": "concept",
    "summary": "Концепт сайта барбершопа.",
    "url": "https://chb-almaty-preview.vercel.app/",
    "alternateUrls": [
      "https://chb-almaty-concept.altairtt60.chatgpt.site/"
    ],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:44.478Z",
      "finalUrl": "https://chb-almaty-preview.vercel.app/"
    },
    "thumbnail": "/projects/chb-barbershop-thumb.webp",
    "previewImage": "/projects/chb-barbershop-preview.webp"
  },
  {
    "id": "kroshka",
    "name": "Крошка",
    "category": "food",
    "status": "demo",
    "summary": "Демонстрационный сайт кондитерской.",
    "url": "https://kroshka-demo.vercel.app/",
    "alternateUrls": [],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:47.354Z",
      "finalUrl": "https://kroshka-demo.vercel.app/"
    },
    "thumbnail": "/projects/kroshka-thumb.webp",
    "previewImage": "/projects/kroshka-preview.webp"
  },
  {
    "id": "fresh-cleaning",
    "name": "Fresh Cleaning",
    "category": "service",
    "status": "demo",
    "summary": "Демонстрационный сайт клининговых услуг.",
    "url": "https://fresh-cleaning-demo.vercel.app/",
    "alternateUrls": [],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:49.999Z",
      "finalUrl": "https://fresh-cleaning-demo.vercel.app/"
    },
    "thumbnail": "/projects/fresh-cleaning-thumb.webp",
    "previewImage": "/projects/fresh-cleaning-preview.webp"
  },
  {
    "id": "clinic-demo",
    "name": "Clinic Demo KZ",
    "category": "healthcare",
    "status": "demo",
    "summary": "Демонстрационный сайт клиники.",
    "url": "https://clinic-demo-kz.vercel.app/",
    "alternateUrls": [],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:52.572Z",
      "finalUrl": "https://clinic-demo-kz.vercel.app/"
    },
    "thumbnail": "/projects/clinic-demo-thumb.webp",
    "previewImage": "/projects/clinic-demo-preview.webp"
  },
  {
    "id": "ielts-embassy",
    "name": "IELTS Embassy",
    "category": "education",
    "status": "concept",
    "summary": "Концепт учебного лендинга.",
    "url": "https://ielts-embassy.vercel.app/",
    "alternateUrls": [
      "https://ielts-embassy-route.altairtt60.chatgpt.site/"
    ],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:55.741Z",
      "finalUrl": "https://ielts-embassy.vercel.app/"
    },
    "thumbnail": "/projects/ielts-embassy-thumb.webp",
    "previewImage": "/projects/ielts-embassy-preview.webp"
  },
  {
    "id": "classlab",
    "name": "ClassLab",
    "category": "education",
    "status": "education",
    "summary": "Каталог учебных проектов.",
    "url": "https://classlab-alt.vercel.app/",
    "alternateUrls": [
      "https://classlab-projects.altairtt60.chatgpt.site/"
    ],
    "verified": true,
    "verification": {
      "state": "ok",
      "httpStatus": 200,
      "checkedAt": "2026-11-07T07:10:58.988Z",
      "finalUrl": "https://classlab-alt.vercel.app/"
    },
    "thumbnail": "/projects/classlab-thumb.webp",
    "previewImage": "/projects/classlab-preview.webp"
  }
];
