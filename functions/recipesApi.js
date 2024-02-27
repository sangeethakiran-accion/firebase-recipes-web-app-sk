const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const FirebaseConfig = require("./FirebaseConfig");
const Utilities = require("./utilities");

const auth = FirebaseConfig.auth;
const firestore = FirebaseConfig.firestore;

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// ---- RESTFUL CRUD WEB API ENDPOINTS ----------

app.post("/recipes", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.status(401).send("Auth Header Missing!");
    return;
  }

  try {
    await Utilities.authorizeUser(authHeader, auth);
  } catch (error) {
    res.status(401).send(error.message);
    return;
  }

  const newRecipe = req.body;
  const missingFields = Utilities.validateSubmittedRecipe(newRecipe);
  if (missingFields.length > 0) {
    res
      .status(400)
      .send(`Recipe with missing / invalid fields : ${missingFields}`);
    return;
  }

  const recipe = Utilities.sanitizeSubmittedRecipe(newRecipe);
  try {
    const firestoreResponse = await firestore.collection("recipes").add(recipe);
    const recipeId = firestoreResponse.id;
    res.status(201).send({ id: recipeId });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.get("/recipes", async (req, res) => {
  const authHeader = req.headers["authorization"];
  const queryObj = req.query;
  const category = queryObj["category"] || "";
  const orderByField = queryObj["orderByField"] || "";
  const orderByDirection = queryObj["orderByDirection"] || "";
  const pageNumber = queryObj["pageNumber"] || "";
  const perPage = queryObj["perPage"] || "";

  let isAuth = false;
  let collectionRef = firestore.collection("recipes");

  try {
    await Utilities.authorizeUser(authHeader, auth);
    isAuth = true;
  } catch (error) {
    collectionRef = collectionRef.where("isPublished", "==", true);
  }

  if (category) {
    collectionRef = collectionRef.where("category", "==", category);
  }
  if (orderByField) {
    collectionRef = collectionRef.orderBy(orderByField, orderByDirection);
  }
  if (perPage) {
    collectionRef = collectionRef.limit(Number(perPage));
  }
  if (pageNumber > 0 && perPage) {
    const offset = (pageNumber - 1) * Number(perPage);
    collectionRef = collectionRef.offset(offset);
  }

  let recipeCount = 0;
  const qryCol = isAuth ? "all" : "published";
  const countDocRef = firestore.collection("recipeCounts").doc(qryCol);
  const countDoc = await countDocRef.get();

  if (countDoc.exists && countDoc.data()) {
    recipeCount = countDoc.data().count;
  }

  try {
    const firestoreResponse = await collectionRef.get();
    const fetchedRecipes = firestoreResponse.docs.map((recipe) => {
      const id = recipe.id;
      const data = recipe.data();
      data.publishDate = data.publishDate._seconds;
      return { ...data, id };
    });

    res.status(200).send({ recipeCount, documents: fetchedRecipes });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.put("/recipes/:id", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.status(401).send("Missing Auth Header");
    return;
  }

  try {
    await Utilities.authorizeUser(authHeader, auth);
  } catch (error) {
    res.status(401).send(error.message);
    return;
  }

  const id = req.params.id;
  const newRecipe = req.body;
  const missingFields = Utilities.validateSubmittedRecipe(newRecipe);
  if (missingFields) {
    res
      .status(400)
      .send(`Invalid Recipe with missing fields : ${missingFields}`);
    return;
  }

  const recipe = Utilities.sanitizeSubmittedRecipe(newRecipe);
  try {
    await firestore.collection("recipes").doc(id).set(recipe);
    res.status(200).send({ id });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.delete("/recipes/:id", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    res.status(401).send("Missing Auth Header");
    return;
  }

  try {
    await Utilities.authorizeUser(authHeader, auth);
  } catch (error) {
    res.status(401).send(error.message);
    return;
  }

  const id = req.params.id;
  try {
    await firestore.collection("recipes").doc(id).delete();
    res.status(200).send("Successfully deleted the recipe");
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Local dev only
if (process.env.NODE_ENV !== "production") {
  app.listen(3005, () => {
    console.log("restful express api server started");
  });
}

module.exports = app;
