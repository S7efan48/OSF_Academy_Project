const express = require("express");
const axios = require("axios");
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

// express app
const app = express();
const secret_key = "$2a$08$V10dkAexa90rdK1LZFYZJusRJTyqO3p8N2NhvSacdUKuJjX3UDohW";
var categories = undefined;

// register view engine
app.set("view engine", "ejs");

// static file
app.use(express.static('public'));

// listen for requests
var port = process.env.PORT || 3000;
app.listen(port);

// middleware
app.use(async(req,res,next) => {
  try{
  const categories_data = await axios.get(`https://osf-digital-backend-academy.herokuapp.com/api/categories/parent/root?secretKey=${secret_key}`);
  categories = categories_data.data;
  next();
  } catch {
    res.status(404).send("Page not found!");
  }
})

// Routing
app.get("/", async (req, res) => {
     res.render("index", { title: "Home", categories});
});

app.get("/category/:id", async (req, res) => {
  try {
    let category_id = req.params.id;
    let category_details;
    categories.forEach(category => {
      if (category.id == category_id ) {
        category_details = {
          name: category.name,
          page_description: category.page_description
        };
      }  
    });
    const subcategories = await axios.get(`https://osf-digital-backend-academy.herokuapp.com/api/categories/parent/${category_id}?secretKey=${secret_key}`);   
    res.render("categories", { title:"Categories", categories, category_details, subcategories : subcategories.data});
  } catch (err) {
    res.render("categories", { title:"Categories", categories, category_details, subcategories : undefined});
  }
});

app.get("/subcategory/:id", async (req, res) => {
try {
 let subcategory_id = req.params.id;
 const subsubcategories = await axios.get(`https://osf-digital-backend-academy.herokuapp.com/api/categories/parent/${subcategory_id}?secretKey=${secret_key}`);
 res.render("subcategories", { title:"Subcategories", categories, subsubcategories : subsubcategories.data});
} catch (err) {
  res.render("subcategories", { title:"Subcategories", categories, subsubcategories : undefined}); 
}
});

app.get("/products/:id", async (req, res) => {
  try {
    let product_category_id = req.params.id;
    const products = await axios.get(`https://osf-digital-backend-academy.herokuapp.com/api/products/product_search?primary_category_id=${product_category_id}&secretKey=${secret_key}`);
    res.render("products", { title: "Products", categories, products: products.data});
  } catch (err) {
    res.render("products", { title: "Products", categories, products: undefined});
  }
});

app.get("/product-details/:id", async (req, res) => {
  try {
    let product_id = req.params.id;
    const product = await axios.get(`https://osf-digital-backend-academy.herokuapp.com/api/products/product_search?id=${product_id}&secretKey=${secret_key}`);
    //console.log(product.data[0]);
    res.render("productDetails", { title: "Product details", categories, product: product.data[0]});
  } catch (err) {
    res.render("productDetails", { title: "Product details", categories, product: undefined});
  }
});

Sentry.init({
  dsn: "https://f9a5746939b9493585d3c4886cfd5651@o1221814.ingest.sentry.io/6365179",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

const transaction = Sentry.startTransaction({
  op: "test",
  name: "My First Test Transaction",
});


// redirect
app.use((req, res) => {
  res.status(404).render("404", { title: "Error", categories});
});
