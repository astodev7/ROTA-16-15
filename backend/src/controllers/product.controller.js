import * as productModel from "../models/product.model.js";

async function listProducts(req, res, next) {
    try {
        const { category } = req.query;

        const products = await productModel.getByCategory(category);

        res.json(products);
    } catch (error) {
        next(error);
    }
}

export {
    listProducts
};