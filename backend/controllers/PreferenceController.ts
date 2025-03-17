import { NextFunction, Request, Response } from "express";
import {
  addAllergyToDb,
  deleteAllergyFromDb,
  getAllergiesFromDb,
} from "../helpers/PreferenceHelper";

export class PreferenceController {
  // POST /preferences/allergies
  async addAllergy(req: Request, res: Response, next: NextFunction) {
    // validation of params performed by express-validator middleware
    const { userID, allergy } = req.body as { userID: string; allergy: string };

    try {
      await addAllergyToDb(userID, allergy);
      res.status(201).json({ message: "Allergy added successfully" });
    } catch (error) {
      next(error);
    }
  }

  // GET /preferences/allergies/:id
  async getAllergies(req: Request, res: Response, next: NextFunction) {
    const userID = req.params.id;

    try {
      const allergies = await getAllergiesFromDb(userID);
      if (allergies.length === 0) {
        return res.status(404).json({ error: "No allergies found" });
      }

      // return list with only allergy names
      res.status(200).json(allergies.map((entry) => entry.allergy));
    } catch (error) {
      next(error);
    }
  }

  // DELETE /preferences/allergies/:id/:allergy
  async deleteAllergy(req: Request, res: Response, next: NextFunction) {
    const { id: userID, allergy } = req.params;

    try {
      const deleteCount = await deleteAllergyFromDb(userID, allergy);
      if (deleteCount === 0) {
        return res.status(404).json({ error: "Allergy not found" });
      }

      res.status(200).json({ message: "Allergy deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
