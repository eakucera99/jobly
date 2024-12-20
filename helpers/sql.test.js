const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("generates correct setCols and values for valid data", function () {
    const dataToUpdate = {
      firstName: "Aliya",
      age: 32,
    };
    const jsToSql = {
      firstName: "first_name",
    };
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);
    expect(result.setCols).toEqual('"first_name"=$1, "age"=$2');
    expect(result.values).toEqual(["Aliya", 32]);
  });

  test("throws BadRequestError for empty data", function () {
    const dataToUpdate = {};
    const jsToSql = {};
    expect(() => {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
    }).toThrow(BadRequestError);
  });

  test("generates correct setCols and values when jsToSql is not provided", function () {
    const dataToUpdate = {
      firstName: "Aliya",
      age: 32,
    };
    const result = sqlForPartialUpdate(dataToUpdate, {});
    expect(result.setCols).toEqual('"firstName"=$1, "age"=$2');
    expect(result.values).toEqual(["Aliya", 32]);
  });
});