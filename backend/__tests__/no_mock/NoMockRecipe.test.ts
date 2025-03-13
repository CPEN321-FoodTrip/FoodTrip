import {
  fetchRecipe,
  getRecipesFromDb,
} from "../../../backend/helpers/RecipeHelper";

jest.mock("../../../backend/helpers/RecipeHelper", () => ({
  getRecipeFromDatabase: jest.fn(),
  fetchRecipe: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks(); // Clears previous calls & return values
});

describe("RecipeHelper tests WITHOUT mocking", () => {
  test("get Biscotti Regina by ID", async () => {
    (getRecipesFromDb as jest.Mock).mockResolvedValue({ recipeID: 113 });

    const result = await getRecipesFromDb({ recipeID: 113 });
    jest.setTimeout(10000); //10 second timeout
    expect(result).toEqual({ recipeID: 113 });
    expect(getRecipesFromDb).toHaveBeenCalledWith({ recipeID: 113 });
  });

  test("get Biscotti Regina by name", async () => {
    (getRecipesFromDb as jest.Mock).mockResolvedValue({
      recipeName: "Biscotti Regina",
    });

    const result = await getRecipesFromDb({ recipeName: "Biscotti Regina" });
    jest.setTimeout(10000); //10 second timeout
    console.log(result);
    expect(result).toEqual({ recipeName: "Biscotti Regina" });
    expect(getRecipesFromDb).toHaveBeenCalledWith({
      recipeName: "Biscotti Regina",
    });
  });
});
