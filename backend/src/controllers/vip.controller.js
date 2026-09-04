import * as vipModel from "../models/vip.model.js";

async function joinVip(req, res, next) {
    try {
        const { name, email } = req.body;

        const exists = await vipModel.existsByEmail(email);

        if (exists) {
            return res.status(409).json({
                message: "Esse e-mail já está na lista VIP."
            });
        }

        await vipModel.add({
            name,
            email
        });

        res.status(201).json({
            message: "Você entrou na lista VIP do Drop 01. Avisamos assim que abrir!"
        });

    } catch (error) {
        next(error);
    }
}


async function getCount(req, res, next) {
    try {
        const count = await vipModel.count();

        res.json({
            count
        });

    } catch (error) {
        next(error);
    }
}


export {
    joinVip,
    getCount
};