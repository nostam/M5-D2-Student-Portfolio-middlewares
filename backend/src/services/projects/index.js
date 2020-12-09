const express = require("express");
const fs = require("fs");
const path = require("path");
const uniqid = require("uniqid");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { userInfo } = require("os");
const { EINPROGRESS } = require("constants");

readDb = (file) => {
  return JSON.parse(fs.readFileSync(path.join(__dirname, file)).toString());
};
writeDb = (newDb, file) => {
  return fs.writeFileSync(path.join(__dirname, file), JSON.stringify(newDb));
};

router.get("/", (req, res, next) => {
  const db = readDb("projects.json");
  res.send(db);
});

router.get("/:id", (req, res, next) => {
  const db = readDb("projects.json");
  const entry = db.find((entry) => entry.id === req.params.id.toString());
  entry ? res.send(entry) : res.status(404).send();
});

router.post(
  "/",
  [
    body("name")
      .isString()
      .isLength({ min: 2 })
      .withMessage("repo name too short")
      .exists()
      .withMessage("give repo a name"),
    body("repoURL").isURL().withMessage("invalid url").exists(),
    body("studentId").isString().isAlphanumeric(),
  ],
  (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) {
        const e = new Error();
        e.message = { errors: err.array() };
        e.http.StatusCode = 400;
        console.log(e);
        next(e);
        // return res.status(400).send(e);
      } else {
        const db = readDb("projects.json");
        const newEntry = {
          ...req.body,
          id: uniqid(),
          creationDate: new Date(),
        };
        const students = readDb("../students/students.json");
        const student = students.find(
          (student) => student.id === req.body.studentId
        );
        if (
          Object.keys(student).length > 0 &&
          student.hasOwnProperty("numberOfProjects")
        ) {
          student.numberOfProjects++;
        } else {
          student.numberOfProjects = 1;
        }
        db.push(newEntry);
        writeDb(db, "projects.json");
        students
          .filter((student) => student !== req.body.studentId)
          .push(student);
        writeDb(students, "../students/students.json");
        res.status(201).send({ id: newEntry.id });
      }
    } catch (error) {
      console.log("err by catch");
      next(e);
    }
  }
);

router.delete("/:id", (req, res, next) => {
  try {
    const db = readDb("projects.json");
    const newDb = db.filter((entry) => entry.id !== req.params.id.toString());
    writeDb(newDb, "projects.json");
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  [
    body("name")
      .isString()
      .isLength({ min: 2 })
      .withMessage("repo name too short")
      .exists()
      .withMessage("give repo a name"),
    body("repoURL").isURL().withMessage("invalid url").exists(),
    body("studentId").isString().isAlphanumeric(),
  ],
  (req, res, next) => {
    try {
      const err = validationResult(req);
      if (!err.isEmpty()) {
        const e = new Error();
        e.message = { errors: err.array() };
        e.http.StatusCode = 400;
        console.log(e);
        next(e);
      } else {
        const db = readDb("projects.json");
        let entry = { ...req.body, id: req.params.id };
        const newDb = db.filter(
          (entry) => entry.id !== req.params.id.toString()
        );
        newDb.push(entry);
        writeDb(newDb, "projects.json");
        res.send(newDb);
      }
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
