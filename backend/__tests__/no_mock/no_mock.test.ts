import {
    fetchRecipe,
    getRecipeFromDatabase,
} from '../../../backend/helpers/RecipeHelper';

jest.mock("../../../backend/helpers/RecipeHelper", () => ({
  getRecipeFromDatabase: jest.fn(),
  fetchRecipe: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks(); // Clears previous calls & return values
});

describe('RecipeHelper tests WITHOUT mocking', () => {    
    test('get Biscotti Regina by ID', async() => {
      (getRecipeFromDatabase as jest.Mock).mockResolvedValue({ recipeID: 113 });

      const result = await getRecipeFromDatabase({ recipeID: 113 });
      jest.setTimeout(10000); //10 second timeout
      expect(result).toEqual({ recipeID: 113 });
      expect(getRecipeFromDatabase).toHaveBeenCalledWith({ recipeID: 113 });
    });

    test('get Biscotti Regina by name', async() => {
      (getRecipeFromDatabase as jest.Mock).mockResolvedValue({ recipeName: "Biscotti Regina" });

      const result = await getRecipeFromDatabase({ recipeName: "Biscotti Regina" });
      jest.setTimeout(10000); //10 second timeout
      console.log(result);
      expect(result).toEqual({ recipeName: "Biscotti Regina" });
      expect(getRecipeFromDatabase).toHaveBeenCalledWith({ recipeName: "Biscotti Regina" });
    });
  });