var express = require('express');
var router = express.Router();
var Book = require('../models').Book;
var Patron = require('../models').Patron;
var Loan = require('../models').Loan;
var sequelize = require('sequelize');
var Op = sequelize.Op;

/* GET all books. */
router.get('/list/:id', function(req, res, next) {
  Promise.all([
    Book.findAll({ offset: req.params.id*10,
                   limit: 10
    }),
    Book.count()
  ])
  .then(function(results) {
    let pages = Math.ceil(results[1]/10);
    let pageArr = [];
    for(let i = 0; i < pages; i++)
      pageArr.push(i);
    res.render('books', {
          books: results[0],
          title: 'Books',
          pages: pageArr,
          activePage: parseInt(req.params.id),
          count: results[1],
          route: 'list',
          categories: ['title', 'author', 'genre'],
          category: '',
          query: ''
    });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* POST all book search. */
router.post('/search/:id', function(req, res, next) {
  let category = req.body.category;
  let query = req.body.query;
  Promise.all([
    Book.findAll({ offset: req.params.id*10,
                   limit: 10,
                   where: {
                     [category]: {
                       [Op.like]: `%${query.toLowerCase()}%`
                     }
                   }
    }),
    Book.count({
      where: {
        [category]: {
          [Op.like]: `%${req.body.query.toLowerCase()}%`
        }
      }
    })
  ])
  .then(function(results) {
    let pages = Math.ceil(results[1]/10);
    let pageArr = [];
    for(let i = 0; i < pages; i++)
      pageArr.push(i);
    res.render('books', {
          books: results[0],
          title: `Books Based On the ${category.charAt(0).toUpperCase() + category.substr(1)}
                  Search: "${req.body.query}"`,
          pages: pageArr,
          activePage: parseInt(req.params.id),
          count: results[1],
          route: 'search',
          categories: ['title', 'author', 'genre'],
          category: category,
          query: query
    });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* GET overdue books. */
router.get('/overdue/:id', function(req, res, next) {
  Promise.all([
    Loan.findAll({
      include: [
        {
          model: Book,
        }
      ],
      where: {
        return_by: {
          [Op.lt]: Date.now(),
        },
        returned_on: null
      },
      offset: req.params.id*10,
      limit: 10
    }),
    Loan.count({
      include: [
        {
          model: Book,
        }
      ],
      where: {
        return_by: {
          [Op.lt]: Date.now(),
        },
        returned_on: null
      }
    })
  ])
  .then(function(results) {
    let books = results[0].map(function(loan) {
      return loan.Book;
    });
    let pages = Math.ceil(results[1]/10);
    let pageArr = [];
    for(let i = 0; i < pages; i++)
      pageArr.push(i);
    res.render('books', {
          books: books,
          title: 'Overdue Books',
          pages: pageArr,
          activePage: parseInt(req.params.id),
          count: results[1],
          route: 'overdue'
    });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* GET checked out books. */
router.get('/checked-out/:id', function(req, res, next) {
  Promise.all([
    Loan.findAll({
      include: [
        {
          model: Book,
        }
      ],
      where: {
        loaned_on: {
          [Op.ne]: null,
        },
        returned_on: null
      },
      offset: req.params.id*10,
      limit: 10
    }),
    Loan.count({
      include: [
        {
          model: Book,
        }
      ],
      where: {
        loaned_on: {
          [Op.ne]: null,
        },
        returned_on: null
      }
    })
  ])
  .then(function(results) {
    let books = results[0].map(function(loan) {
      return loan.Book;
    });
    let pages = Math.ceil(results[1]/10);
    let pageArr = [];
    for(let i = 0; i < pages; i++)
      pageArr.push(i);
    res.render('books', {
            books: books,
            title: 'Checked Out Books',
            pages: pageArr,
            activePage: parseInt(req.params.id),
            count: results[1],
            route: 'checked-out'
    });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* GET new book creation page. */
router.get('/new', function(req, res, next) {
  res.render('books/new', {
      book: {},
      title: 'New Book'
  });
});

/* POST create new book. */
router.post('/new', function(req, res, next) {
  Book
    .create(req.body)
    .then(function() {
      res.redirect('/books/list/0');
    })
    .catch(function(error) {
      if(error.name === "SequelizeValidationError")
        res.render('books/new', {
            book: req.body,
            title: 'New Book',
            errors: error.errors
        });
      else if(error.name === 'SequelizeUniqueConstraintError')
        res.render('books/new', {
            book: req.body,
            title: 'New Book',
            errors: [{ message: 'You must input a unique title into the "Title" field.'}]
        });
      else
        throw error;
    })
    .catch(function(error) {
        res.render('error', { title: 'Error', error: error });
    });
});

/* GET  book details. */
router.get('/detail/:id', function(req, res, next) {
  Loan.findAll({
    include: [
      {
        model: Book
      },
      {
        model: Patron
      }
    ],
    where: {
      book_id: req.params.id
    }
  }).then(function(loans) {
    let books = loans.map(function(loan) {
      return loan.Book;
    });
    let patrons = loans.map(function(loan) {
      return loan.Patron;
    });
    if(books.length > 0)
      return res.render('books/detail', {
                            books: books,
                            loans: loans,
                            patrons: patrons,
                            title: `Book: ${books[0].title}`
      });
    else
      Book.findAll({
        where: {
          id: req.params.id
        }
      }).then(function(books) {
          books = books;
          res.render('books/detail', { books: books,
                                loans: loans,
                                patrons: patrons,
                                title: `Book: ${books[0].title}`
          });
      }).catch(function(error) {
          res.render('error', { title: 'Error', error: error });
      });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* POST update book. */
router.post('/update/:id', function(req, res, next) {
  Book
    .update(req.body, {
      where: {
        id: req.params.id
      }
    })
    .then(function() {
      return res.redirect('/books/list/0');
    })
    .catch(function(error) {
      if(error.name === "SequelizeValidationError") {
        Loan.findAll({
          include: [
            {
              model: Book
            },
            {
              model: Patron
            }
          ],
          where: {
            book_id: req.params.id
          }
        }).then(function(loans) {
          if(loans.length > 0)
            return res.render('books/detail', {
                books: [req.body],
                loans: loans,
                title: `Book: ${loans[0].Book.title}`,
                errors: error.errors
            });
          else
            Book.findAll({
              where: {
                id: req.params.id
              }
            }).then(function(books) {
                return res.render('books/detail', {
                    books: [req.body],
                    loans: loans,
                    title: `Book: ${books[0].title}`,
                    errors: error.errors
                });
            }).catch(function(error) {
                res.render('error', { title: 'Error', error: error });
            });
        }).catch(function(error) {
            res.render('error', { title: 'Error', error: error });
        });
      } else
        throw error;
    })
    .catch(function(error) {
        res.render('error', { title: 'Error', error: error });
    });
});

module.exports = router;
