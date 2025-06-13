const express = require('express');
const axios = require("axios");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // 정적파일(HTML, CSS, JS) 제공용

const categoryMap = {
    "주요구성": { cate1: "17", cate2: null },
    "모니터": { cate1: "1", cate2: null },
    "주변기기": { cate1: "94", cate2: null },
    "소프트웨어": { cate1: "1922", cate2: null },
    "개인방송장비": { cate1: "252", cate2: null }
};

const pcmainDetailMap = {
    "cpu": "18",
    "쿨러/튜닝": "1879", // 쿨러
    "메인보드": "20",
    "메모리": "19", // ram
    "그래픽카드": "21", // vga
    "ssd": "28",
    "hdd": "22",
    "케이스": "24",
    "파워": "25",
    "조립비": "1843",
    // 여기에 필요한 다른 상세 카테고리들을 추가할 수 있습니다.
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


// fetchProducts 함수 정의 변경: listOrder 인자 추가
async function fetchProducts(cmd, cate1, cate2, listOrder) {
    const url = "https://www.smtcom.co.kr/skin/shop/basic/estimate_search_new2.php";

    const payload = new URLSearchParams({
        "pd_ment": "Y",
        "chkk[제조회사]": "",
        "search": cmd,
        "depth": "2",
        "cate1": cate1,
        "cate2": cate2 || "",
        "cate3": "",
        "cate4": "",
        "page": "1",
        "list_num": "100", // list_num은 string으로 보내는 것이 안전
        "view_no": "Y"
    });

    const headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://www.smtcom.co.kr",
        "Referer": "https://www.smtcom.co.kr/skin/shop/basic/estimate_search_new_top2.php",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36", // User-Agent를 좀 더 일반적인 것으로 변경
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7", // Accept 헤더도 좀 더 일반적인 것으로 변경
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7" // Accept-Language도 일반적인 것으로 변경
    };

    try {
        const response = await axios.post(url, payload.toString(), {
            headers,
            responseType: "arraybuffer"
        });

        const decodedBody = iconv.decode(response.data, "euc-kr");
        const $ = cheerio.load(decodedBody);
        const products = [];

        $("div.OECR_P_1").each((i, elem) => {
            const nameTag = $(elem).find("td.name a");
            const name = nameTag.text().trim();
            const link = nameTag.attr("href") ? "https://www.smtcom.co.kr" + nameTag.attr("href") : "";

            const imgTag = $(elem).find("div.ORB_P_img img");
            const image = imgTag.attr("src") ? "https://www.smtcom.co.kr" + imgTag.attr("src") : "";

            // --- 상품 설명(spec) 추출 로직 다시 수정 ---
            let spec = "";
            const specTd = $(elem).find("div.ORB_product_spec td");

            if (specTd.length > 0) {
                // Cheerio의 contents()와 filter(nodeType === 3)를 사용하여 텍스트 노드만 가져옵니다.
                // 그 후 첫 번째 텍스트 노드의 내용을 가져와 불필요한 공백과 "상품정보"를 제거합니다.
                spec = specTd.contents().filter(function () {
                    return this.nodeType === 3; // 텍스트 노드만 필터링 (Node.TEXT_NODE)
                }).first().text().trim(); // 첫 번째 텍스트 노드만 가져와 trim

                // 불필요한 "상품정보"와 그 주변의 공백/줄바꿈 패턴 제거 (여전히 필요할 수 있음)
                spec = spec.replace(/상품정보\s*\S*\s*\S*\s*/g, '').trim();

                // 연속된 공백을 하나로 줄이고, 불필요한 줄바꿈 제거
                spec = spec.replace(/\s+/g, ' ').trim();

                // 혹시 모를 ' /' 반복 제거 (예: 'A / B / C /' -> 'A / B / C')
                // 마지막 '/'가 붙는 경우를 대비하여 한 번 더 처리
                if (spec.endsWith(' /')) {
                    spec = spec.slice(0, -2).trim(); // 마지막 ' /' 제거
                }
            }


            const price = $(elem).find("span.OPP_price").text().trim().replace(/,/g, "");

            products.push({ name, link, image, spec, price });
        });

        return products;
    } catch (error) {
        console.error("Error fetching products:", error);
        throw new Error("상품을 가져오는 중 오류가 발생했습니다: " + error.message);
    }
}

// API 라우트 변경: list_order 인자를 req.body에서 받아 fetchProducts에 전달
app.post('/api/search', async (req, res) => {
    const { cmd, category, detail, list_order } = req.body; // list_order를 req.body에서 받도록 추가

    if (!cmd && !category) {
        return res.status(400).json({ error: "cmd 또는 category는 필수 입력입니다." });
    }

    const categoryKey = category.trim();
    const categoryInfo = categoryMap[categoryKey];
    if (!categoryInfo) {
        return res.status(400).json({ error: "유효하지 않은 카테고리입니다." });
    }

    let cate1 = categoryInfo.cate1;
    let cate2 = categoryInfo.cate2;

    if (categoryKey === "주요구성" && detail) {
        const mappedDetail = pcmainDetailMap[detail];
        if (mappedDetail) {
            cate2 = mappedDetail;
        } else {
            console.warn(`Warning: No mapping found for detail: ${detail} in pcmainDetailMap`);
        }
    }
    // 다른 카테고리의 detail 매핑이 필요하면 여기에 추가

    // list_order가 전달되지 않았거나 빈 값일 경우 기본값 설정 (선택사항)
    const finalSortOrder = list_order || "C.pd_suggest desc,C.pd_sold desc"; // 기본값 '인기상품순'

    try {
        const products = await fetchProducts(cmd, cate1, cate2, finalSortOrder); // list_order를 fetchProducts에 전달
        res.json({ products });
    } catch (e) {
        console.error("API Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});