import { NextFunction, Request, Response } from "express";
import {
  addAllergyToDb,
  deleteAllergyFromDb,
  getAllergiesFromDb,
} from "../helpers/PreferenceHelper";
import { Allergy } from "../interfaces/PreferenceInterfaces";

// POST /preferences/allergies
export const addAllergy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // validation of params performed by express-validator middleware
    const { userID, allergy }: Allergy = req.body;

    await addAllergyToDb(userID, allergy);
    res.status(201).json({ message: "Allergy added successfully" });
  } catch (error) {
    next(error);
  }
};

// GET /preferences/allergies/:id
export const getAllergies = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
};

// DELETE /preferences/allergies/:id/:allergy
export const deleteAllergy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: userID, allergy } = req.params;

    const deleteCount = await deleteAllergyFromDb(userID, allergy);
    if (deleteCount === 0) {
      return res.status(404).json({ error: "Allergy not found" });
    }

    res.status(200).json({ message: "Allergy deleted successfully" });
  } catch (error) {
    next(error);
  }
};
