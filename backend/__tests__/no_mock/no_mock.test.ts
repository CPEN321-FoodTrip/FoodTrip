import {
    sum
} from '../../../backend/helpers/RecipeHelper';

// import { sum } from '../../example';  // EXAMPLE

// test('adds 1 + 2 to equal 3', () => {
//   expect(sum(1, 2)).toBe(3);
// });


// const myBeverage = {
//   delicious: true,
//   sour: false,
// };

// describe('my beverage', () => {
//   test('is delicious', () => {
//     expect(myBeverage.delicious).toBeTruthy();
//   });

//   test('is not sour', () => {
//     expect(myBeverage.sour).toBeFalsy();
//   });
// });

describe('tests WITHOUT mocking', () => {
    test('testing sum from recipeHelper', () => { // test description
      expect(sum(1, 2)).toBe(3);
    });
  
    test('', () => {
    //   expect(myBeverage.sour).toBeFalsy();
    });
  });
