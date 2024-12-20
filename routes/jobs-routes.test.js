"use strict";

const request = require("supertest");

const db = require("../db.js");
const app = require("../app.js");
const Job = require("../models/jobs.js");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  adminToken,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            companyHandle: "c1",
            title: "J-new",
            salary: 10,
            equity: "0.2",
          })
          .set("authorization", `Bearer ${adminToken}`);
      expect(resp.statusCode).toEqual(201);
      expect(resp.body).toEqual({
        job: {
          id: expect.any(Number),
          title: "J-new",
          salary: 10,
          equity: "0.2",
          companyHandle: "c1",
      },
    });
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "Software Engineer",
          salary: 100000,
          equity: 0.1,
          companyHandle: "c1",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "Software Engineer",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "Software Engineer",
          salary: "100000",
          equity: "0.1",
          companyHandle: "c1",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
            id: expect.any(Number),
            title: "J1",
            salary: 1,
            equity: "0.1",
            companyHandle: "c1",
            companyName: "C1",
        },
        {
            id: expect.any(Number),
            title: "J2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c1",
            companyName: "C1",
          },
          {
            id: expect.any(Number),
            title: "J3",
            salary: 3,
            equity: null,
            companyHandle: "c1",
            companyName: "C1",
          },
      ]
    });
  });

  test("works: with filter", async function () {
    const resp = await request(app)
        .get("/jobs?minSalary=90000&hasEquity=true");
    expect(resp.body).toEqual({
      jobs: [
        {
          id: expect.any(Number),
          title: "J1",
          salary: 1,
          equity: "0.1",
          companyHandle: "c1",
          companyName: "C1",
        },
      ],
    });
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
      const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
      expect(resp.body).toEqual({
        job: {
          id: testJobIds[0],
          title: "J1",
          salary: 1,
          equity: "0.1",
          company: {
            handle: "c1",
            name: "C1",
            description: "Desc1",
            numEmployees: 1,
            logoUrl: "http://c1.img",
          },
        },
      });
    });
  
    test("not found for no such job", async function () {
      const resp = await request(app).get(`/jobs/0`);
      expect(resp.statusCode).toEqual(404);
    });
  });
  

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", () => {
  test("works for admin", async function () {
    const job = await Job.create({
      title: "Software Engineer",
      salary: 100000,
      equity: 0.1,
      companyHandle: "c1",
    });
    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          title: "Senior Software Engineer",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id: job.id,
        title: "Senior Software Engineer",
        salary: 100000,
        equity: 0.1,
        companyHandle: "c1",
      },
    });
  });

  test("unauth for non-admin", async function () {
    const job = await Job.create({
      title: "Software Engineer",
      salary: 100000,
      equity: 0.1,
      companyHandle: "c1",
    });
    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          title: "Senior Software Engineer",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for non-existent job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "Senior Software Engineer",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data", async function () {
    const job = await Job.create({
      title: "Software Engineer",
      salary: 100000,
      equity: 0.1,
      companyHandle: "c1",
    });
    const resp = await request(app)
        .patch(`/jobs/${job.id}`)
        .send({
          salary: "100000",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const job = await Job.create({
      title: "Software Engineer",
      salary: 100000,
      equity: 0.1,
      companyHandle: "c1",
    });
    const resp = await request(app)
        .delete(`/jobs/${job.id}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: job.id });
  });

  test("unauth for non-admin", async function () {
    const job = await Job.create({
      title: "Software Engineer",
      salary: 100000,
      equity: 0.1,
      companyHandle: "c1",
    });
    const resp = await request(app)
        .delete(`/jobs/${job.id}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for non-existent job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});