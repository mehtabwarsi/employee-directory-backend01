
const express = require('express')
const cors = require('cors')
const pool = require('./db')
require('dotenv').config()

const app = express()

app.use(cors())
app.use(express.json())

// GET: Fetch all employees
app.get('/api/employees', async (req,res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM employees ORDER BY id DESC'
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to fetch employees' })
  }
})

// POST: Add employee
app.post('/api/employees', async (req, res) => {
  const { name, email, role } = req.body

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof email !== 'string' || !email.trim() ||
    typeof role !== 'string' || !role.trim()
  ) {
    return res.status(400).json({
      message: 'Name, email and role are required',
    })
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO employees (name, email, role) VALUES (?, ?, ?)',
      [name.trim(), email.trim(), role.trim()]
    )

    const [rows] = await pool.execute(
      'SELECT * FROM employees WHERE id = ?',
      [result.insertId]
    )

    res.status(201).json(rows[0])
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'This email is already registered',
      })
    }

    console.error(error)
    res.status(500).json({ message: 'Failed to add employee' })
  }
})

// PUT: Update employee
app.put('/api/employees/:id', async (req, res) => {
  const id = Number(req.params.id)
  const { name, email, role } = req.body

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid employee ID' })
  }

  if (
    typeof name !== 'string' || !name.trim() ||
    typeof email !== 'string' || !email.trim() ||
    typeof role !== 'string' || !role.trim()
  ) {
    return res.status(400).json({
      message: 'Name, email and role are required',
    })
  }

  try {
    const [result] = await pool.execute(
      'UPDATE employees SET name = ?, email = ?, role = ? WHERE id = ?',
      [name.trim(), email.trim(), role.trim(), id]
    )

    if (result.affectedRows === 0) {
      const [existing] = await pool.execute(
        'SELECT id FROM employees WHERE id = ?',
        [id]
      )

      if (existing.length === 0) {
        return res.status(404).json({ message: 'Employee not found' })
      }
    }

    const [rows] = await pool.execute(
      'SELECT * FROM employees WHERE id = ?',
      [id]
    )

    res.json(rows[0])
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'This email is already registered',
      })
    }

    console.error(error)
    res.status(500).json({ message: 'Failed to update employee' })
  }
})

// DELETE: Remove employee
app.delete('/api/employees/:id', async (req, res) => {
  const id = Number(req.params.id)

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid employee ID' })
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM employees WHERE id = ?',
      [id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    res.json({ message: 'Employee deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to delete employee' })
  }
})

// Test route
app.get('/', ( res) => {
  res.send('Employee Directory API is running!')
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
