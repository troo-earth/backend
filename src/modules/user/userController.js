const { createUser, updateUser } = require('./userService');

// Create user route
async function createUserController(req, res) {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Missing request body.' });
    }
    const { user_name, email, password } = req.body;

    // Basic input validation
    if (!user_name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Call service to create user (checks for duplicates, hashes password)
    const user = await createUser({ user_name, email, password });

    // Success!
    return res.status(201).json(user);
  } catch (error) {
    // Duplicate email error
    if (error.message === 'Email already registered') {
      return res.status(409).json({ error: error.message });
    } else if (error.message === 'Invalid email format') {
      return res.status(400).json({ error: error.message });
    }
    else if (error.message === 'Password does not meet requirements') {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: 'Server error. Could not create user.' });
  }
}

// Update user route
async function updateUserController(req, res) {
  try {
    const user_id = req.params.id;
    const updateFields = req.body;
    const user = await updateUser(user_id, updateFields);
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
}

module.exports = { createUserController, updateUserController };
