const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


let expenses = [
    { id: 1, description: 'Groceries', amount: 45.50, category: 'Food', date: '2024-01-15' },
    { id: 2, description: 'Gas', amount: 30.00, category: 'Transportation', date: '2024-01-14' },
    { id: 3, description: 'Coffee', amount: 4.50, category: 'Food', date: '2024-01-13' }
];

let nextId = 4;


//Api routes

app.get('/api/expenses', (req, res) => {
    const { category, startDate, endDate } = req.query;
    let filteredExpenses = [...expenses];

    if (category && category !== 'all') {
        filteredExpenses = filteredExpenses.filter(exp => exp.category === category);
    }

    if (startDate) {
        filteredExpenses = filteredExpenses.filter(exp => exp.date >= startDate);
    }

    if (endDate) {
        filteredExpenses = filteredExpenses.filter(exp => exp.date <= endDate);
    }

    res.json(filteredExpenses);
});

app.post('/api/expenses', (req, res) => {
    const { description, amount, category, date } = req.body;
    
    if (!description || !amount || !category || !date) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const newExpense = {
        id: nextId++,
        description,
        amount: parseFloat(amount),
        category,
        date
    };

    expenses.push(newExpense);
    res.status(201).json(newExpense);
});

app.put('/api/expenses/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { description, amount, category, date } = req.body;
    
    const expenseIndex = expenses.findIndex(exp => exp.id === id);
    
    if (expenseIndex === -1) {
        return res.status(404).json({ error: 'Expense not found' });
    }

    expenses[expenseIndex] = {
        id,
        description: description || expenses[expenseIndex].description,
        amount: amount ? parseFloat(amount) : expenses[expenseIndex].amount,
        category: category || expenses[expenseIndex].category,
        date: date || expenses[expenseIndex].date
    };

    res.json(expenses[expenseIndex]);
});

app.delete('/api/expenses/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const expenseIndex = expenses.findIndex(exp => exp.id === id);
    
    if (expenseIndex === -1) {
        return res.status(404).json({ error: 'Expense not found' });
    }

    expenses.splice(expenseIndex, 1);
    res.status(204).send();
});

app.get('/api/expenses/summary', (req, res) => {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const byCategory = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {});

    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === thisMonth && expenseDate.getFullYear() === thisYear;
    });
    
    const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    res.json({
        total,
        monthlyTotal,
        byCategory,
        count: expenses.length
    });
});

// render the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
})