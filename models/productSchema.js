const mongDBB = require("mongoose");
const Schema = mongDBB.Schema;

const ArticleScheme = new Schema({
   imgSrc:String,
   price:Number,
   stars:Number,
    name:String,
    description:String,
   quantity: Number 
});

const userData = mongDBB.model("productsData", ArticleScheme);
module.exports = userData;