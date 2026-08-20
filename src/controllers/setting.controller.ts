import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { ApiResponse } from '../utils/apiResponse';

export const getCountdown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: 'countdown_target' }
    });

    if (!setting) {
      // Return default if not found
      return res.json(ApiResponse.success({ targetDate: "2026-05-09T00:00:00" }));
    }

    res.json(ApiResponse.success({ targetDate: setting.value }));
  } catch (error) {
    next(error);
  }
};
