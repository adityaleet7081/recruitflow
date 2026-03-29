const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const {
  JWT_SECRET, JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN
} = require('../config/env');

const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    companyId: user.company_id,
  };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

const toSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const register = async (req, res, next) => {
  const { companyName, name, email, password } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already registered' });
    }

    let slug = toSlug(companyName);
    const slugCheck = await client.query('SELECT id FROM companies WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) slug = `${slug}-${uuidv4().slice(0, 6)}`;

    const companyResult = await client.query(
      'INSERT INTO companies (name, slug) VALUES ($1, $2) RETURNING *',
      [companyName, slug]
    );
    const company = companyResult.rows[0];

    const passwordHash = await bcrypt.hash(password, 12);
    const userResult = await client.query(
      `INSERT INTO users (company_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'admin') RETURNING *`,
      [company.id, name, email, passwordHash]
    );
    const user = userResult.rows[0];

    const { accessToken, refreshToken } = generateTokens(user);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await client.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [hashedRefresh, user.id]);

    await client.query('COMMIT');

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: { id: company.id, name: company.name, slug: company.slug, plan: company.plan },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT u.*, c.name AS company_name, c.slug AS company_slug, c.plan AS company_plan
       FROM users u JOIN companies c ON u.company_id = c.id
       WHERE u.email = $1`,
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user);
    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [hashedRefresh, user.id]);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: {
        id: user.company_id,
        name: user.company_name,
        slug: user.company_slug,
        plan: user.company_plan
      },
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = result.rows[0];

    if (!user || !user.refresh_token) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const valid = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!valid) return res.status(401).json({ error: 'Invalid refresh token' });

    const tokens = generateTokens(user);
    const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);
    await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [hashedRefresh, user.id]);

    res.json(tokens);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(err);
  }
};

const logout = async (req, res, next) => {
  const { refreshToken } = req.body;
  try {
    if (refreshToken) {
      const decoded = jwt.decode(refreshToken);
      if (decoded?.id) {
        await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [decoded.id]);
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role,
              c.id AS company_id, c.name AS company_name, c.slug, c.plan
       FROM users u JOIN companies c ON u.company_id = c.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: { id: user.company_id, name: user.company_name, slug: user.slug, plan: user.plan },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, refresh, logout, getMe };