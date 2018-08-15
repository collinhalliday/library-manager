const express = require('express');
const router = express.Router();
const Loan = require('../models').Loan;
const Book = require('../models').Book;
const Patron = require('../models').Patron;
const sequelize = require('sequelize');
const Op = sequelize.Op;
const dateFormat = require('dateformat');

/* GET all loans. */
router.get('/', function(req, res, next) {
  //Finds all loans and related book and patron info.
  Loan.findAll({
      include: [
        {
          model: Book,
        },
        {
          model: Patron,
        }
      ]
    }).then(function(loans) {
    res.render('loans', { loans: loans, title: 'Loans' });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* GET overdue loans. */
router.get('/overdue', function(req, res, next) {
  //Finds all loans that are overdue, including related book and patron info.
  Loan.findAll({
      include: [
        {
          model: Book,
        },
        {
          model: Patron,
        }
      ],
      where: {
        return_by: {
          [Op.lt]: Date.now(),
        },
        returned_on: null
      }
    }).then(function(loans) {
    res.render('loans', { loans: loans, title: 'Overdue Loans' });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* GET checked out books. */
router.get('/checked-out', function(req, res, next) {
  //Finds all loans that are checked out, including related book and patron info.
  Loan.findAll({
    include: [
      {
        model: Book,
      },
      {
        model: Patron,
      }
    ],
    where: {
      loaned_on: {
        [Op.ne]: null,
      },
      returned_on: null
    }
  }).then(function(loans) {
    let books = loans.map(function(loan) {
      return loan.Book;
    });
    res.render('loans', { loans: loans, title: 'Checked Out Loans' });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* GET new loan page. */
router.get('/new', function(req, res, next) {
  Promise.all([
    //Finds all loans that are currently checked out, including related book info
    Loan.findAll({
      include: [
        {
          model: Book
        }
      ],
      where: {
        returned_on: null
      }
    }),
    //Finds all patrons
    Patron.findAll()
  ])
  .then(function(results) {
    //Creates array of book ids for books that are currently checked out.
    let loanedBookIds = results[0].map(function(loan) {
      return loan.Book.id;
    });
    let patrons = results[1];
    //Finds all books that are not checked out.
    Book.findAll({
      where: {
        id: {
          [Op.notIn]: loanedBookIds
        }
      }
    }).then(function(unloanedBooks) {
        //Finds and formats today's date and date seven days from today
        let now = new Date();
        let nowPlusSeven = new Date(now).setDate(now.getDate() + 7);
        let loanedOn = dateFormat(now, "yyyy-mm-dd");
        let returnBy = dateFormat(nowPlusSeven, "yyyy-mm-dd");
        //Displays page for user to select from books that are not checked out,
        //existing patrons, and a prepopulated, but changeable, checkout date and return by date.
        res.render('loans/new', {
                      title: "New Loan",
                      books: unloanedBooks,
                      book_id: '',
                      patrons: patrons,
                      patron_id: '',
                      loanedOn: loanedOn,
                      returnBy: returnBy
        });
    }).catch(function(error) {
        res.render('error', { title: 'Error', error: error });
    });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });;
});

/* POST create new loan. */
router.post('/new', function(req, res, next) {
  //Creates new loan with input from form
  Loan
    .create(req.body)
    .then(function() {
      res.redirect('/loans');
    })
    .catch(function(error) {
      //If validation error, finds info for form, displays errors and directs
      //user to correct them before submission.
      if(error.name === "SequelizeValidationError") {
        Promise.all([
          Loan.findAll({
            include: [
              {
                model: Book
              }
            ],
            where: {
              returned_on: null
            }
          }),
          Patron.findAll()
        ])
        .then(function(results) {
          let loanedBookIds = results[0].map(function(loan) {
            return loan.Book.id;
          });
          let patrons = results[1];
          Book.findAll({
            where: {
              id: {
                [Op.notIn]: loanedBookIds
              }
            }
          }).then(function(unloanedBooks) {
            res.render('loans/new', {
                title: 'New Loan',
                books: unloanedBooks,
                book_id: parseInt(req.body.book_id),
                patrons: patrons,
                patron_id: parseInt(req.body.patron_id),
                loanedOn: req.body.loaned_on,
                returnBy: req.body.return_by,
                errors: error.errors
            });
          }).catch(function(error) {
                res.render('error', { title: 'Error', error: error });
            });
          }).catch(function(error) {
              res.render('error', { title: 'Error', error: error });
          });
      } else
        throw error
    })
    .catch(function(error) {
        res.render('error', { title: 'Error', error: error });
    });
});

/* GET return book page. */
router.get('/return/:id', function(req, res, next) {
  //Finds particular loan based on loan id and populates return form
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
      id: req.params.id
    }
  })
  .then(function(loans) {
      res.render('loans/return', {
            title: 'Return Book',
            loan: loans[0],
            book: loans[0].Book,
            patron: loans[0].Patron,
            today: dateFormat(new Date(), "yyyy-mm-dd")
      });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* POST return book (update loan). */
router.post('/return/:id', function(req, res, next) {
  //updates loan by included a returned on date based on loan id.
  Loan
    .update(req.body, {
      where: {
        id: req.params.id
      }
    })
    .then(function() {
      return res.redirect('/loans');
    })
    .catch(function(error) {
      //if validation error, repopulates return form and displays errors for user to correct.
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
            id: req.params.id
          }
        })
        .then(function(loans) {
            res.render('loans/return', {
                  title: 'Return Book',
                  loan: loans[0],
                  book: loans[0].Book,
                  patron: loans[0].Patron,
                  today: req.body.returned_on,
                  errors: error.errors
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
