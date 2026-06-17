export type CityEntry = {
  city: string;
  country: string;
  flag: string;
};

export type CountryEntry = {
  name: string;
  flag: string;
};

/** Same city/country data as public/questionnaire.html */
export const cities: CityEntry[] = [
  {
    "city": "Madrid",
    "country": "España",
    "flag": "🇪🇸"
  },
  {
    "city": "Barcelona",
    "country": "España",
    "flag": "🇪🇸"
  },
  {
    "city": "Sevilla",
    "country": "España",
    "flag": "🇪🇸"
  },
  {
    "city": "Valencia",
    "country": "España",
    "flag": "🇪🇸"
  },
  {
    "city": "Bilbao",
    "country": "España",
    "flag": "🇪🇸"
  },
  {
    "city": "Ciudad de México",
    "country": "México",
    "flag": "🇲🇽"
  },
  {
    "city": "Cancún",
    "country": "México",
    "flag": "🇲🇽"
  },
  {
    "city": "Guadalajara",
    "country": "México",
    "flag": "🇲🇽"
  },
  {
    "city": "Monterrey",
    "country": "México",
    "flag": "🇲🇽"
  },
  {
    "city": "Oaxaca",
    "country": "México",
    "flag": "🇲🇽"
  },
  {
    "city": "Buenos Aires",
    "country": "Argentina",
    "flag": "🇦🇷"
  },
  {
    "city": "Córdoba",
    "country": "Argentina",
    "flag": "🇦🇷"
  },
  {
    "city": "Mendoza",
    "country": "Argentina",
    "flag": "🇦🇷"
  },
  {
    "city": "Bariloche",
    "country": "Argentina",
    "flag": "🇦🇷"
  },
  {
    "city": "Bogotá",
    "country": "Colombia",
    "flag": "🇨🇴"
  },
  {
    "city": "Medellín",
    "country": "Colombia",
    "flag": "🇨🇴"
  },
  {
    "city": "Cartagena",
    "country": "Colombia",
    "flag": "🇨🇴"
  },
  {
    "city": "Cali",
    "country": "Colombia",
    "flag": "🇨🇴"
  },
  {
    "city": "Lima",
    "country": "Perú",
    "flag": "🇵🇪"
  },
  {
    "city": "Cusco",
    "country": "Perú",
    "flag": "🇵🇪"
  },
  {
    "city": "Arequipa",
    "country": "Perú",
    "flag": "🇵🇪"
  },
  {
    "city": "Machu Picchu",
    "country": "Perú",
    "flag": "🇵🇪"
  },
  {
    "city": "São Paulo",
    "country": "Brasil",
    "flag": "🇧🇷"
  },
  {
    "city": "Río de Janeiro",
    "country": "Brasil",
    "flag": "🇧🇷"
  },
  {
    "city": "Salvador",
    "country": "Brasil",
    "flag": "🇧🇷"
  },
  {
    "city": "Florianópolis",
    "country": "Brasil",
    "flag": "🇧🇷"
  },
  {
    "city": "Santiago",
    "country": "Chile",
    "flag": "🇨🇱"
  },
  {
    "city": "Valparaíso",
    "country": "Chile",
    "flag": "🇨🇱"
  },
  {
    "city": "Atacama",
    "country": "Chile",
    "flag": "🇨🇱"
  },
  {
    "city": "París",
    "country": "Francia",
    "flag": "🇫🇷"
  },
  {
    "city": "Lyon",
    "country": "Francia",
    "flag": "🇫🇷"
  },
  {
    "city": "Niza",
    "country": "Francia",
    "flag": "🇫🇷"
  },
  {
    "city": "Marsella",
    "country": "Francia",
    "flag": "🇫🇷"
  },
  {
    "city": "Londres",
    "country": "Reino Unido",
    "flag": "🇬🇧"
  },
  {
    "city": "Edimburgo",
    "country": "Reino Unido",
    "flag": "🇬🇧"
  },
  {
    "city": "Manchester",
    "country": "Reino Unido",
    "flag": "🇬🇧"
  },
  {
    "city": "Roma",
    "country": "Italia",
    "flag": "🇮🇹"
  },
  {
    "city": "Milán",
    "country": "Italia",
    "flag": "🇮🇹"
  },
  {
    "city": "Venecia",
    "country": "Italia",
    "flag": "🇮🇹"
  },
  {
    "city": "Florencia",
    "country": "Italia",
    "flag": "🇮🇹"
  },
  {
    "city": "Nápoles",
    "country": "Italia",
    "flag": "🇮🇹"
  },
  {
    "city": "Berlín",
    "country": "Alemania",
    "flag": "🇩🇪"
  },
  {
    "city": "Múnich",
    "country": "Alemania",
    "flag": "🇩🇪"
  },
  {
    "city": "Hamburgo",
    "country": "Alemania",
    "flag": "🇩🇪"
  },
  {
    "city": "Frankfurt",
    "country": "Alemania",
    "flag": "🇩🇪"
  },
  {
    "city": "Ámsterdam",
    "country": "Países Bajos",
    "flag": "🇳🇱"
  },
  {
    "city": "Róterdam",
    "country": "Países Bajos",
    "flag": "🇳🇱"
  },
  {
    "city": "Lisboa",
    "country": "Portugal",
    "flag": "🇵🇹"
  },
  {
    "city": "Oporto",
    "country": "Portugal",
    "flag": "🇵🇹"
  },
  {
    "city": "Algarve",
    "country": "Portugal",
    "flag": "🇵🇹"
  },
  {
    "city": "Tokio",
    "country": "Japón",
    "flag": "🇯🇵"
  },
  {
    "city": "Kioto",
    "country": "Japón",
    "flag": "🇯🇵"
  },
  {
    "city": "Osaka",
    "country": "Japón",
    "flag": "🇯🇵"
  },
  {
    "city": "Hiroshima",
    "country": "Japón",
    "flag": "🇯🇵"
  },
  {
    "city": "Sapporo",
    "country": "Japón",
    "flag": "🇯🇵"
  },
  {
    "city": "Bangkok",
    "country": "Tailandia",
    "flag": "🇹🇭"
  },
  {
    "city": "Chiang Mai",
    "country": "Tailandia",
    "flag": "🇹🇭"
  },
  {
    "city": "Phuket",
    "country": "Tailandia",
    "flag": "🇹🇭"
  },
  {
    "city": "Koh Samui",
    "country": "Tailandia",
    "flag": "🇹🇭"
  },
  {
    "city": "Bali",
    "country": "Indonesia",
    "flag": "🇮🇩"
  },
  {
    "city": "Yakarta",
    "country": "Indonesia",
    "flag": "🇮🇩"
  },
  {
    "city": "Yogyakarta",
    "country": "Indonesia",
    "flag": "🇮🇩"
  },
  {
    "city": "Nueva York",
    "country": "EE.UU.",
    "flag": "🇺🇸"
  },
  {
    "city": "Los Ángeles",
    "country": "EE.UU.",
    "flag": "🇺🇸"
  },
  {
    "city": "Miami",
    "country": "EE.UU.",
    "flag": "🇺🇸"
  },
  {
    "city": "Chicago",
    "country": "EE.UU.",
    "flag": "🇺🇸"
  },
  {
    "city": "San Francisco",
    "country": "EE.UU.",
    "flag": "🇺🇸"
  },
  {
    "city": "Las Vegas",
    "country": "EE.UU.",
    "flag": "🇺🇸"
  },
  {
    "city": "Nueva Orleans",
    "country": "EE.UU.",
    "flag": "🇺🇸"
  },
  {
    "city": "Dubái",
    "country": "Emiratos Árabes",
    "flag": "🇦🇪"
  },
  {
    "city": "Abu Dabi",
    "country": "Emiratos Árabes",
    "flag": "🇦🇪"
  },
  {
    "city": "Marrakech",
    "country": "Marruecos",
    "flag": "🇲🇦"
  },
  {
    "city": "Fez",
    "country": "Marruecos",
    "flag": "🇲🇦"
  },
  {
    "city": "Casablanca",
    "country": "Marruecos",
    "flag": "🇲🇦"
  },
  {
    "city": "El Cairo",
    "country": "Egipto",
    "flag": "🇪🇬"
  },
  {
    "city": "Luxor",
    "country": "Egipto",
    "flag": "🇪🇬"
  },
  {
    "city": "Asuán",
    "country": "Egipto",
    "flag": "🇪🇬"
  },
  {
    "city": "Sharm el-Sheij",
    "country": "Egipto",
    "flag": "🇪🇬"
  },
  {
    "city": "Nairobi",
    "country": "Kenia",
    "flag": "🇰🇪"
  },
  {
    "city": "Mombasa",
    "country": "Kenia",
    "flag": "🇰🇪"
  },
  {
    "city": "Ciudad del Cabo",
    "country": "Sudáfrica",
    "flag": "🇿🇦"
  },
  {
    "city": "Johannesburgo",
    "country": "Sudáfrica",
    "flag": "🇿🇦"
  },
  {
    "city": "Safari Kruger",
    "country": "Sudáfrica",
    "flag": "🇿🇦"
  },
  {
    "city": "Sídney",
    "country": "Australia",
    "flag": "🇦🇺"
  },
  {
    "city": "Melbourne",
    "country": "Australia",
    "flag": "🇦🇺"
  },
  {
    "city": "Brisbane",
    "country": "Australia",
    "flag": "🇦🇺"
  },
  {
    "city": "Cairns",
    "country": "Australia",
    "flag": "🇦🇺"
  },
  {
    "city": "Singapur",
    "country": "Singapur",
    "flag": "🇸🇬"
  },
  {
    "city": "Hong Kong",
    "country": "Hong Kong",
    "flag": "🇭🇰"
  },
  {
    "city": "Seúl",
    "country": "Corea del Sur",
    "flag": "🇰🇷"
  },
  {
    "city": "Busan",
    "country": "Corea del Sur",
    "flag": "🇰🇷"
  },
  {
    "city": "Pekín",
    "country": "China",
    "flag": "🇨🇳"
  },
  {
    "city": "Shanghái",
    "country": "China",
    "flag": "🇨🇳"
  },
  {
    "city": "Guangzhou",
    "country": "China",
    "flag": "🇨🇳"
  },
  {
    "city": "Mumbai",
    "country": "India",
    "flag": "🇮🇳"
  },
  {
    "city": "Nueva Delhi",
    "country": "India",
    "flag": "🇮🇳"
  },
  {
    "city": "Jaipur",
    "country": "India",
    "flag": "🇮🇳"
  },
  {
    "city": "Goa",
    "country": "India",
    "flag": "🇮🇳"
  },
  {
    "city": "Reikiavik",
    "country": "Islandia",
    "flag": "🇮🇸"
  },
  {
    "city": "Oslo",
    "country": "Noruega",
    "flag": "🇳🇴"
  },
  {
    "city": "Bergen",
    "country": "Noruega",
    "flag": "🇳🇴"
  },
  {
    "city": "Estocolmo",
    "country": "Suecia",
    "flag": "🇸🇪"
  },
  {
    "city": "Gotemburgo",
    "country": "Suecia",
    "flag": "🇸🇪"
  },
  {
    "city": "Copenhague",
    "country": "Dinamarca",
    "flag": "🇩🇰"
  },
  {
    "city": "Helsinki",
    "country": "Finlandia",
    "flag": "🇫🇮"
  },
  {
    "city": "Praga",
    "country": "República Checa",
    "flag": "🇨🇿"
  },
  {
    "city": "Viena",
    "country": "Austria",
    "flag": "🇦🇹"
  },
  {
    "city": "Salzburgo",
    "country": "Austria",
    "flag": "🇦🇹"
  },
  {
    "city": "Zúrich",
    "country": "Suiza",
    "flag": "🇨🇭"
  },
  {
    "city": "Ginebra",
    "country": "Suiza",
    "flag": "🇨🇭"
  },
  {
    "city": "Bruselas",
    "country": "Bélgica",
    "flag": "🇧🇪"
  },
  {
    "city": "Brujas",
    "country": "Bélgica",
    "flag": "🇧🇪"
  },
  {
    "city": "Atenas",
    "country": "Grecia",
    "flag": "🇬🇷"
  },
  {
    "city": "Santorini",
    "country": "Grecia",
    "flag": "🇬🇷"
  },
  {
    "city": "Mykonos",
    "country": "Grecia",
    "flag": "🇬🇷"
  },
  {
    "city": "Creta",
    "country": "Grecia",
    "flag": "🇬🇷"
  },
  {
    "city": "Estambul",
    "country": "Turquía",
    "flag": "🇹🇷"
  },
  {
    "city": "Capadocia",
    "country": "Turquía",
    "flag": "🇹🇷"
  },
  {
    "city": "Antalya",
    "country": "Turquía",
    "flag": "🇹🇷"
  },
  {
    "city": "Cracovia",
    "country": "Polonia",
    "flag": "🇵🇱"
  },
  {
    "city": "Varsovia",
    "country": "Polonia",
    "flag": "🇵🇱"
  },
  {
    "city": "Budapest",
    "country": "Hungría",
    "flag": "🇭🇺"
  },
  {
    "city": "La Habana",
    "country": "Cuba",
    "flag": "🇨🇺"
  },
  {
    "city": "Trinidad",
    "country": "Cuba",
    "flag": "🇨🇺"
  },
  {
    "city": "Santo Domingo",
    "country": "R. Dominicana",
    "flag": "🇩🇴"
  },
  {
    "city": "Punta Cana",
    "country": "R. Dominicana",
    "flag": "🇩🇴"
  },
  {
    "city": "San José",
    "country": "Costa Rica",
    "flag": "🇨🇷"
  },
  {
    "city": "Tamarindo",
    "country": "Costa Rica",
    "flag": "🇨🇷"
  },
  {
    "city": "Ciudad de Panamá",
    "country": "Panamá",
    "flag": "🇵🇦"
  },
  {
    "city": "Quito",
    "country": "Ecuador",
    "flag": "🇪🇨"
  },
  {
    "city": "Galápagos",
    "country": "Ecuador",
    "flag": "🇪🇨"
  },
  {
    "city": "Cuenca",
    "country": "Ecuador",
    "flag": "🇪🇨"
  },
  {
    "city": "La Paz",
    "country": "Bolivia",
    "flag": "🇧🇴"
  },
  {
    "city": "Uyuni",
    "country": "Bolivia",
    "flag": "🇧🇴"
  },
  {
    "city": "Montevideo",
    "country": "Uruguay",
    "flag": "🇺🇾"
  },
  {
    "city": "Punta del Este",
    "country": "Uruguay",
    "flag": "🇺🇾"
  },
  {
    "city": "Asunción",
    "country": "Paraguay",
    "flag": "🇵🇾"
  },
  {
    "city": "Katmandú",
    "country": "Nepal",
    "flag": "🇳🇵"
  },
  {
    "city": "Hanói",
    "country": "Vietnam",
    "flag": "🇻🇳"
  },
  {
    "city": "Ciudad Ho Chi Minh",
    "country": "Vietnam",
    "flag": "🇻🇳"
  },
  {
    "city": "Hoi An",
    "country": "Vietnam",
    "flag": "🇻🇳"
  },
  {
    "city": "Siem Riep",
    "country": "Camboya",
    "flag": "🇰🇭"
  },
  {
    "city": "Phnom Penh",
    "country": "Camboya",
    "flag": "🇰🇭"
  },
  {
    "city": "Rangún",
    "country": "Myanmar",
    "flag": "🇲🇲"
  },
  {
    "city": "Bagan",
    "country": "Myanmar",
    "flag": "🇲🇲"
  },
  {
    "city": "Kuala Lumpur",
    "country": "Malasia",
    "flag": "🇲🇾"
  },
  {
    "city": "Langkawi",
    "country": "Malasia",
    "flag": "🇲🇾"
  },
  {
    "city": "Manila",
    "country": "Filipinas",
    "flag": "🇵🇭"
  },
  {
    "city": "Boracay",
    "country": "Filipinas",
    "flag": "🇵🇭"
  },
  {
    "city": "Palawan",
    "country": "Filipinas",
    "flag": "🇵🇭"
  },
  {
    "city": "Colombo",
    "country": "Sri Lanka",
    "flag": "🇱🇰"
  },
  {
    "city": "Kandy",
    "country": "Sri Lanka",
    "flag": "🇱🇰"
  },
  {
    "city": "Tel Aviv",
    "country": "Israel",
    "flag": "🇮🇱"
  },
  {
    "city": "Jerusalén",
    "country": "Israel",
    "flag": "🇮🇱"
  },
  {
    "city": "Ammán",
    "country": "Jordania",
    "flag": "🇯🇴"
  },
  {
    "city": "Petra",
    "country": "Jordania",
    "flag": "🇯🇴"
  },
  {
    "city": "Wadi Rum",
    "country": "Jordania",
    "flag": "🇯🇴"
  },
  {
    "city": "Toronto",
    "country": "Canadá",
    "flag": "🇨🇦"
  },
  {
    "city": "Vancouver",
    "country": "Canadá",
    "flag": "🇨🇦"
  },
  {
    "city": "Montreal",
    "country": "Canadá",
    "flag": "🇨🇦"
  },
  {
    "city": "Auckland",
    "country": "Nueva Zelanda",
    "flag": "🇳🇿"
  },
  {
    "city": "Queenstown",
    "country": "Nueva Zelanda",
    "flag": "🇳🇿"
  },
  {
    "city": "Moscú",
    "country": "Rusia",
    "flag": "🇷🇺"
  },
  {
    "city": "San Petersburgo",
    "country": "Rusia",
    "flag": "🇷🇺"
  }
];

export const countries: CountryEntry[] = [
  {
    "name": "Alemania",
    "flag": "🇩🇪"
  },
  {
    "name": "Argentina",
    "flag": "🇦🇷"
  },
  {
    "name": "Australia",
    "flag": "🇦🇺"
  },
  {
    "name": "Austria",
    "flag": "🇦🇹"
  },
  {
    "name": "Bélgica",
    "flag": "🇧🇪"
  },
  {
    "name": "Bolivia",
    "flag": "🇧🇴"
  },
  {
    "name": "Brasil",
    "flag": "🇧🇷"
  },
  {
    "name": "Camboya",
    "flag": "🇰🇭"
  },
  {
    "name": "Canadá",
    "flag": "🇨🇦"
  },
  {
    "name": "Chile",
    "flag": "🇨🇱"
  },
  {
    "name": "China",
    "flag": "🇨🇳"
  },
  {
    "name": "Colombia",
    "flag": "🇨🇴"
  },
  {
    "name": "Corea del Sur",
    "flag": "🇰🇷"
  },
  {
    "name": "Costa Rica",
    "flag": "🇨🇷"
  },
  {
    "name": "Cuba",
    "flag": "🇨🇺"
  },
  {
    "name": "Dinamarca",
    "flag": "🇩🇰"
  },
  {
    "name": "Ecuador",
    "flag": "🇪🇨"
  },
  {
    "name": "EE.UU.",
    "flag": "🇺🇸"
  },
  {
    "name": "Egipto",
    "flag": "🇪🇬"
  },
  {
    "name": "Emiratos Árabes",
    "flag": "🇦🇪"
  },
  {
    "name": "España",
    "flag": "🇪🇸"
  },
  {
    "name": "Filipinas",
    "flag": "🇵🇭"
  },
  {
    "name": "Finlandia",
    "flag": "🇫🇮"
  },
  {
    "name": "Francia",
    "flag": "🇫🇷"
  },
  {
    "name": "Grecia",
    "flag": "🇬🇷"
  },
  {
    "name": "Hong Kong",
    "flag": "🇭🇰"
  },
  {
    "name": "Hungría",
    "flag": "🇭🇺"
  },
  {
    "name": "India",
    "flag": "🇮🇳"
  },
  {
    "name": "Indonesia",
    "flag": "🇮🇩"
  },
  {
    "name": "Islandia",
    "flag": "🇮🇸"
  },
  {
    "name": "Israel",
    "flag": "🇮🇱"
  },
  {
    "name": "Italia",
    "flag": "🇮🇹"
  },
  {
    "name": "Japón",
    "flag": "🇯🇵"
  },
  {
    "name": "Jordania",
    "flag": "🇯🇴"
  },
  {
    "name": "Kenia",
    "flag": "🇰🇪"
  },
  {
    "name": "Malasia",
    "flag": "🇲🇾"
  },
  {
    "name": "Marruecos",
    "flag": "🇲🇦"
  },
  {
    "name": "México",
    "flag": "🇲🇽"
  },
  {
    "name": "Myanmar",
    "flag": "🇲🇲"
  },
  {
    "name": "Nepal",
    "flag": "🇳🇵"
  },
  {
    "name": "Noruega",
    "flag": "🇳🇴"
  },
  {
    "name": "Nueva Zelanda",
    "flag": "🇳🇿"
  },
  {
    "name": "Países Bajos",
    "flag": "🇳🇱"
  },
  {
    "name": "Panamá",
    "flag": "🇵🇦"
  },
  {
    "name": "Paraguay",
    "flag": "🇵🇾"
  },
  {
    "name": "Perú",
    "flag": "🇵🇪"
  },
  {
    "name": "Polonia",
    "flag": "🇵🇱"
  },
  {
    "name": "Portugal",
    "flag": "🇵🇹"
  },
  {
    "name": "R. Dominicana",
    "flag": "🇩🇴"
  },
  {
    "name": "Reino Unido",
    "flag": "🇬🇧"
  },
  {
    "name": "República Checa",
    "flag": "🇨🇿"
  },
  {
    "name": "Rusia",
    "flag": "🇷🇺"
  },
  {
    "name": "Singapur",
    "flag": "🇸🇬"
  },
  {
    "name": "Sri Lanka",
    "flag": "🇱🇰"
  },
  {
    "name": "Sudáfrica",
    "flag": "🇿🇦"
  },
  {
    "name": "Suecia",
    "flag": "🇸🇪"
  },
  {
    "name": "Suiza",
    "flag": "🇨🇭"
  },
  {
    "name": "Tailandia",
    "flag": "🇹🇭"
  },
  {
    "name": "Turquía",
    "flag": "🇹🇷"
  },
  {
    "name": "Uruguay",
    "flag": "🇺🇾"
  },
  {
    "name": "Vietnam",
    "flag": "🇻🇳"
  }
];

export function searchCountries(query: string, limit = 8): CountryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return countries.slice(0, limit);
  return countries
    .filter((c) => c.name.toLowerCase().includes(q))
    .slice(0, limit);
}

export function searchCities(query: string, limit = 8): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return cities
    .filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
