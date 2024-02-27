const authorizeUser = async (authorizationHeader, firebaseAuth) => {
  if (!authorizationHeader) {
    // eslint-disable-next-line no-throw-literal
    throw "No Auth Header Provided!";
  }
  const token = authorizationHeader.split(" ")[1];
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw error;
  }
};

const validateSubmittedRecipe = (newRecipe) => {
  let missingFields = "";

  if (!newRecipe) {
    missingFields += "recipe";
    return missingFields;
  }

  if (!newRecipe.name) {
    missingFields += "name";
  }
  if (!newRecipe.category) {
    missingFields += "category";
  }
  if (!newRecipe.directions) {
    missingFields += "directions";
  }
  if (!newRecipe.imageUrl) {
    missingFields += "imageUrl";
  }
  if (newRecipe.isPublished !== true && newRecipe.isPublished !== false) {
    missingFields += "isPublished";
  }
  if (!newRecipe.publishDate) {
    missingFields += "publishDate";
  }
  if (!newRecipe.ingredients || newRecipe.ingredients.length === 0) {
    missingFields += "ingredients";
  }
  return missingFields;
};

const sanitizeSubmittedRecipe = (newRecipe) => {
  const recipe = {};
  recipe.name = newRecipe.name;
  recipe.category = newRecipe.category;
  recipe.directions = newRecipe.directions;
  recipe.imageUrl = newRecipe.imageUrl;
  recipe.publishDate = new Date(newRecipe.publishDate * 1000);
  recipe.isPublished = newRecipe.isPublished;
  recipe.ingredients = newRecipe.ingredients;
  return recipe;
};

module.exports = {
  authorizeUser,
  validateSubmittedRecipe,
  sanitizeSubmittedRecipe,
};
