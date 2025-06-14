// server.js (수정된 파일)

const express = require('express');
const fetchProducts = require('./crawler/product-crawler'); // 크롤러 모듈 임포트
const { categoryMap, pcmainDetailMap } = require('./config/category-maps'); // 카테고리 데이터 임포트

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 'public' 폴더를 정적 파일 제공 폴더로 지정합니다.
// 이렇게 하면 HTML, CSS, JS 파일이 정상적으로 로드됩니다.
app.use(express.static('public'));

app.post('/api/search', async (req, res) => {
    // body에서 list_order를 받아옵니다.
    const { cmd, category, detail, list_order } = req.body;

    if (!category) {
        return res.status(400).json({ error: "category는 필수 입력입니다." });
    }

    const categoryKey = category.trim();
    const categoryInfo = categoryMap[categoryKey];
    if (!categoryInfo) {
        return res.status(400).json({ error: "유효하지 않은 카테고리입니다." });
    }

    let cate1 = categoryInfo.cate1;
    let cate2 = categoryInfo.cate2;

    // "주요구성" 카테고리일 경우, 세부 카테고리 코드를 할당합니다.
    if (categoryKey === "주요구성" && detail) {
        const mappedDetail = pcmainDetailMap[detail];
        if (mappedDetail) {
            cate2 = mappedDetail;
        } else {
            console.warn(`Warning: No mapping found for detail: ${detail} in pcmainDetailMap`);
        }
    }
    // TODO: 다른 카테고리(모니터, 주변기기 등)의 detail 매핑이 필요하면 여기에 추가합니다.

    // list_order가 없으면 기본값(인기상품순)으로 설정합니다.
    const finalSortOrder = list_order || "C.pd_suggest desc,C.pd_sold desc";

    try {
        // 분리된 fetchProducts 함수를 호출합니다.
        const products = await fetchProducts(cmd || "", cate1, cate2, finalSortOrder);
        res.json({ products });
    } catch (e) {
        console.error("API Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});