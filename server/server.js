// server/server.js

const express = require('express');
const path = require('path');
const { fetchAndSave, getAllProducts, resetAllProducts } = require('./utils/scraper'); // 경로 변경
const { ALL_CATEGORIES_DETAIL_MAP } = require('./utils/categories'); // 경로 변경

const app = express();
const PORT = 3000;

// public 폴더를 정적 파일 서비스 루트로 설정
app.use(express.static(path.join(__dirname, '../public')));

// API 엔드포인트: 상품 가져오기
app.get('/api/products', async (req, res) => {
    const {
        mainCategory: TARGET_MAIN_CATEGORY,
        subCategory: TARGET_SUB_CATEGORY_NAME,
        searchKeyword: SEARCH_KEYWORD = "",
        listOrder: LIST_ORDER = "C.pd_suggest desc,C.pd_sold desc",
        listNum: LIST_NUM = "10",
        pageNum: PAGE_NUM = "1"
    } = req.query;

    resetAllProducts(); // 새로운 검색 전, 이전 검색 결과 초기화

    const mainCategory = ALL_CATEGORIES_DETAIL_MAP[TARGET_MAIN_CATEGORY]; //

    if (!mainCategory) { //
        return res.status(400).json({ error: `"${TARGET_MAIN_CATEGORY}" 메인 카테고리를 찾을 수 없습니다.` }); //
    }

    const selectedCategory = mainCategory.find(cat => cat.name === TARGET_SUB_CATEGORY_NAME); //

    if (!selectedCategory) { //
        return res.status(400).json({ error: `"${TARGET_MAIN_CATEGORY}"에서 "${TARGET_SUB_CATEGORY_NAME}" 서브 카테고리를 찾을 수 없습니다.` }); //
    }

    try {
        if (selectedCategory.isGroup && selectedCategory.subCategories) { //
            for (const subCat of selectedCategory.subCategories) { //
                const effectiveCate1 = subCat.cate1 || selectedCategory.cate1; //
                await fetchAndSave( //
                    SEARCH_KEYWORD,
                    effectiveCate1,
                    subCat.cate2, //
                    LIST_ORDER,
                    LIST_NUM,
                    PAGE_NUM,
                    TARGET_MAIN_CATEGORY,
                    `${selectedCategory.name} - ${subCat.name}`
                );
            }
        } else {
            await fetchAndSave( //
                SEARCH_KEYWORD,
                selectedCategory.cate1, //
                selectedCategory.cate2, //
                LIST_ORDER,
                LIST_NUM,
                PAGE_NUM,
                TARGET_MAIN_CATEGORY,
                selectedCategory.name //
            );
        }

        const finalProducts = getAllProducts(); //
        res.json(finalProducts);

    } catch (error) {
        console.error("스크래핑 중 오류 발생:", error);
        res.status(500).json({ error: "상품을 가져오는 데 실패했습니다." });
    }
});

// 모든 경로에 대해 public/index.html을 반환 (SPA를 위한 설정)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});