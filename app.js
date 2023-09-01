const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initilizeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initilizeDatabaseAndServer();

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
app.use(express.json());
//GETTING TODO LIST*

app.get("/todos/", async (request, response) => {
  let getSqlQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getSqlQuery = `
            SELECT
                *
            FROM
                todo 
            WHERE
                todo LIKE '%${search_q}%'
                AND status = '${status}'
                AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getSqlQuery = `SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%'
          AND status ='${status}'`;
      break;
    case hasPriorityProperty(request.query):
      getSqlQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE
            todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      break;
    default:
      getSqlQuery = `SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%'`;
  }
  const result = await db.all(getSqlQuery);
  response.send(result);
});

//GETTING PARTICULAR LIST

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const gettingTodoQuery = `SELECT * FROM todo
    WHERE id=${todoId}`;
  const singleTodoList = await db.get(gettingTodoQuery);
  response.send(singleTodoList);
});

//POST TODO

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = response.body;
  const postTodoQuery = `INSERT INTO todo
    (id,todo,priority,status)
    VALUES (
         ${id},
        '${todo}',
        '${priority}',
        '${status}'
    )`;
  const newTodo = await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//PUT TODO

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const putTodoQuery = "";
  switch (true) {
    case requestBody.status !== undefined:
      putTodoQuery = "Status";
      break;
    case requestBody.priority !== undefined:
      putTodoQuery = "Priority";
      break;
    case requestBody.todo !== undefined:
      putTodoQuery = "Todo";
      break;
  }
  const previousQuery = `SELECT * FROM todo WHERE id=${todoId}`;

  const previousList = await db.get(previousQuery);

  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;

  const updateQuery = `UPDATE todo
  SET 
      todo='${todo}',
      priority='${priority}',
      status='${status}'
  WHERE 
      id=${todoId}`;

  await db.run(updateQuery);
  response.send(`${putTodoQuery} Updated`);
});

//DELETE TODO

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo
    WHERE id=${todoId}`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

app.listen(3000, () => {
  console.log("server is running");
});

module.exports = app;
