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
    const { userID, allergy } = req.body;

    try {
      const result = await addAllergyToDb(userID, allergy);
      if (!result) {
        throw new Error("Failed to update allergies");
      }

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
      if (!allergies) {
        throw new Error("Failed to retrieve allergies");
      }
      if (allergies.length === 0) {
        return res.status(404).json({ error: "No allergies found" });
      }

      res.status(200).json({ message: "Allergies retrieved successfully" });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /preferences/allergies/:id/:allergy
  async deleteAllergy(req: Request, res: Response, next: NextFunction) {
    const { userID, allergy } = req.params;

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
