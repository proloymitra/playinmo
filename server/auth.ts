import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { Express, NextFunction, Request, Response } from 'express';
import { pool } from './db';
import { storage } from './storage';

// Set up session store
const pgSession = connectPgSimple(session);
const sessionStore = new pgSession({
  pool,
  tableName: 'sessions',
  createTableIfMissing: false,
});

// Configure session middleware
export const configureSession = (app: Express) => {
  app.set('trust proxy', 1);
  
  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || 'keyboard cat', // Better to set this as an environment variable
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false, // Set to false for development on Replit
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      },
    })
  );
};

// Configure Passport.js
export const configurePassport = (app: Express) => {
  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    console.log('Serializing user:', user);
    // For admin users with special ID 999, serialize the entire user object
    if (user.id === 999) {
      done(null, { type: 'admin', user });
    } else {
      done(null, { type: 'regular', id: user.id });
    }
  });

  passport.deserializeUser(async (data: any, done) => {
    try {
      console.log('Deserializing user with data:', data);
      
      // Handle old format where only ID was stored
      if (typeof data === 'number') {
        if (data === 999) {
          // Special admin user
          const adminUser = {
            id: 999,
            username: 'proloymitra@gmail.com',
            email: 'proloymitra@gmail.com',
            isAdmin: true,
            createdAt: new Date()
          };
          console.log('Deserialized admin user (legacy):', adminUser);
          done(null, adminUser);
        } else {
          // Regular user - fetch from database
          const user = await storage.getUser(data);
          console.log('Deserialized regular user:', user);
          done(null, user);
        }
      } else if (data.type === 'admin') {
        // Return the admin user directly
        console.log('Deserialized admin user:', data.user);
        done(null, data.user);
      } else {
        // Regular user - fetch from database
        const user = await storage.getUser(data.id);
        console.log('Deserialized regular user:', user);
        done(null, user);
      }
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error, null);
    }
  });
  
  // Set up Local Strategy for username/password login
  passport.use(new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: 'Incorrect username' });
        }
        
        if (user.password !== password) {
          return done(null, false, { message: 'Incorrect password' });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Set up Google Strategy - only if credentials are provided
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (googleClientId && googleClientSecret) {
    console.log('Configuring Google authentication strategy');
    
    // Configure for custom domain only
    passport.use(
      new GoogleStrategy(
        {
          clientID: googleClientId,
          clientSecret: googleClientSecret,
          callbackURL: `https://playinmo.com/api/auth/google/callback`,
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log('Google OAuth profile received:', {
              id: profile.id,
              displayName: profile.displayName,
              emails: profile.emails,
              photos: profile.photos
            });

            let user = await storage.getUserByGoogleId(profile.id);
            console.log('Existing user found:', user ? 'Yes' : 'No');

            if (!user) {
              const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
              const baseUsername = profile.displayName || email.split('@')[0];
              const photoUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

              let username = baseUsername;
              let counter = 1;
              while (await storage.getUserByUsername(username)) {
                username = `${baseUsername}${counter}`;
                counter++;
              }

              console.log('Creating new user with data:', {
                username,
                email,
                googleId: profile.id,
                avatarUrl: photoUrl,
              });

              user = await storage.createUser({
                username,
                email,
                googleId: profile.id,
                avatarUrl: photoUrl,
              });
              
              console.log('New user created:', user);
            }

            console.log('Returning user to passport:', user);
            return done(null, user);
          } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error as Error, undefined);
          }
        }
      )
    );

    // Simple Google OAuth routes
    app.get('/api/auth/google', (req, res, next) => {
      const hostname = req.get('host');
      console.log('Google OAuth initiated from:', hostname);
      passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    });

    app.get('/api/auth/google/callback', 
      passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
      (req, res) => {
        console.log('Google OAuth callback successful, user:', req.user);
        console.log('Session ID:', req.sessionID);
        console.log('Is authenticated:', req.isAuthenticated());
        
        // Always redirect to custom domain
        res.redirect('https://playinmo.com/');
      }
    );
  } else {
    console.log('Google authentication not configured - skipping strategy setup');
  }

  // Local authentication routes
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: Error | null, user: Express.User | false, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || 'Authentication failed' });
      }
      req.login(user, (err: Error | null) => {
        if (err) {
          return next(err);
        }
        // Don't return the password in the response
        const { password, ...userWithoutPassword } = user as any;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.get('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Error logging out', err);
      }
      res.redirect('/');
    });
  });

  app.get('/api/auth/user', (req, res) => {
    console.log('Auth check - Session ID:', req.sessionID);
    console.log('Auth check - Is authenticated:', req.isAuthenticated());
    console.log('Auth check - User:', req.user);
    console.log('Auth check - Session:', req.session);
    
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: 'Not authenticated' });
    }
  });
};

// Middleware to check if user is authenticated
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Not authenticated' });
};