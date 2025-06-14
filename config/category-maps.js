// config/category-maps.js

const categoryMap = {
    "주요구성": { cate1: "17", cate2: null },
    "모니터": { cate1: "1", cate2: null },
    "주변기기": { cate1: "94", cate2: null },
    "소프트웨어": { cate1: "1922", cate2: null },
    "개인방송장비": { cate1: "252", cate2: null }
};

const pcmainDetailMap = {
    "cpu": "18",
    "쿨러/튜닝": "1879",
    "메인보드": "20",
    "메모리": "19",
    "그래픽카드": "21",
    "ssd": "28",
    "hdd": "22",
    "케이스": "24",
    "파워": "25",
    "조립비": "1843",
};

const monitorDetailMap = {
    "24인치": "1911",
    "27인치": "1912",
    "30인치": "1913",
    "144hz": "1914",
    "uhd": "1915"
};

const peripheralDetailMap = {
    "키보드": "1898",
    "마우스": "1899",
    "키보드/마우스": "1900",
    "마우스주변기기": "1978",
    "헤드셋": "1901",
    "스피커": "1902",
    "마우스패드": "1903",
    "공유기": "1904",
    "컨트롤러": "95",
    "외장하드": "97",
    "케이블": "98",
    "usb메모리": "99",
    "네트워크장비": "1957",
    "이어폰": "1960",
    "키보드용품": "1977",
    "기타상품": "1984",
    "미니pc": "2024"
};

const softwareDetailMap = {
    "운영체제": "1924",
    "오피스": "1925",
    "백신": "1926"
};

const broadcastDetailMap = {
    "마이크": "1909",
    "웹캠": "1905",
    "사운드카드": "1906",
    "캡쳐보드": "1907",
    "휴대폰주변기기": "1988",
    "네트워크장비": "255"
};

// 모든 맵 객체를 내보냅니다.
module.exports = {
    categoryMap,
    pcmainDetailMap,
    monitorDetailMap,
    peripheralDetailMap,
    softwareDetailMap,
    broadcastDetailMap
};