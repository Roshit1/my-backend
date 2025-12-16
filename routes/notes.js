const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const fetchUser = require('../middleware/fetchUser');
const { body, validationResult } = require('express-validator');

// Route 1: Get all notes (login required)
router.get('/fetchallnotes', fetchUser, async (req, res) => {
    try {
        const notes = await Note.find({ user: req.user.id });
        res.json(notes);
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route 2: Add note (login required)
router.post('/addnote', fetchUser, [
    body('title', "Title must be at least 3 characters").isLength({ min: 3 }),
    body('description', "Description must be at least 5 characters").isLength({ min: 5 })
], async (req, res) => {
    try {
        const { title, description, tag, author } = req.body;

        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        // Create new note
        const note = new Note({
            title,
            description,
            tag,
            author,
            user: req.user.id
        });

        const saveNote = await note.save();
        res.json(saveNote);

    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route 3: Update an existing note (Login required)
router.put('/updatenote/:id', fetchUser, [
    body('title', "Title must be at least 3 characters").optional().isLength({ min: 3 }),
    body('description', "Description must be at least 5 characters").optional().isLength({ min: 5 })
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, tag, author } = req.body;

        // Create an object containing the fields to be updated
        const newNote = {};
        if (title) newNote.title = title;
        if (description) newNote.description = description;
        if (tag) newNote.tag = tag;
        if (author) newNote.author = author;

        // Find the note to update
        let note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        // Check if the note belongs to the logged-in user
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ error: "Not authorized to update this note" });
        }

        // Update the note
        note = await Note.findByIdAndUpdate(
            req.params.id,
            { $set: newNote },
            { new: true }
        );

        res.json(note);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Route 4: Delete an existing note (Login required)
router.delete('/deletenote/:id', fetchUser, async (req, res) => {
    try {
        // Find the note to delete
        let note = await Note.findById(req.params.id);
        if (!note) {
            return res.status(404).json({ error: "Note not found" });
        }

        // Allow deletion only if the user owns this note
        if (note.user.toString() !== req.user.id) {
            return res.status(401).json({ error: "Not authorized to delete this note" });
        }

        // Delete the note
        await Note.findByIdAndDelete(req.params.id);

        res.json({ success: "Note deleted successfully", note: note });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
