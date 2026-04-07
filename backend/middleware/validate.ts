import { z } from "zod";

export const validate = (schema) => async (req, res, next) => {
  try {
    const validatedData = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    // Merge coerced data back into request
    if (validatedData.body) req.body = validatedData.body;
    if (validatedData.query) req.query = validatedData.query;
    if (validatedData.params) Object.assign(req.params, validatedData.params);

    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const zodError = error as z.ZodError<any>;
      return res.status(400).json({
        error: "Validation Error",
        details: zodError.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      });
    }
    return res.status(500).json({ error: "Validation Failed" });
  }
};
