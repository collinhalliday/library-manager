const express = require('express');
const router = express.Router();
const Patron = require('../models').Patron;
const Loan = require('../models').Loan;
const Book = require('../models').Book;
const sequelize = require('sequelize');
const Op = sequelize.Op;

/* GET all patrons. */
router.get('/list/:id', function(req, res, next) {
  Promise.all([
    //Finds certain set of patrons based on pagination link clicked.
    Patron.findAll({ offset: req.params.id*10,
                     limit: 10
    }),
    //Finds total patron count.
    Patron.count()
  ])
  .then(function(results) {
    //Sets up pagination link info by calculating how many pages are necessary
    //(i.e. ten per page)
    let pages = Math.ceil(results[1]/10);
    let pageArr = [];
    for(let i = 0; i < pages; i++)
      pageArr.push(i);
    res.render('patrons', {
            patrons: results[0],
            title: 'Patrons',
            pages: pageArr,
            activePage: parseInt(req.params.id),
            count: results[1],
            route: 'list',
            categories: [
                  {
                    value: 'first_name',
                    name: 'First Name'
                  },
                  {
                    value: 'last_name',
                    name: 'Last Name'
                  },
                  {
                    value: 'library_id',
                    name: 'Library ID'
                  }
            ],
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
  //Sets ups search option form value and display value.
  let categories = [
        {
          value: 'first_name',
          name: 'First Name'
        },
        {
          value: 'last_name',
          name: 'Last Name'
        },
        {
          value: 'library_id',
          name: 'Library ID'
        }
  ];

  //function that properly formats category (i.e. from "first_name" to "First Name")
  function formatCategory (string) {
    let reformattedString = '';
    string.split("_").forEach(function(subStr) {
      if(subStr.charAt(0) === 'i')
        reformattedString += subStr.charAt(0).toUpperCase() + subStr.charAt(1).toUpperCase() + subStr.substr(2) + ' ';
      else
        reformattedString += subStr.charAt(0).toUpperCase() + subStr.substr(1) + ' ';
    });
    return reformattedString;
  }

  Promise.all([
    //Finds set of patrons based on search category, query and pagination link clicked.
    Patron.findAll({ offset: req.params.id*10,
                   limit: 10,
                   where: {
                     [category]: {
                       [Op.like]: `%${query.toLowerCase()}%`
                     }
                   }
    }),
    //Finds total patron count based on search category and query.
    Patron.count({
      where: {
        [category]: {
          [Op.like]: `%${req.body.query.toLowerCase()}%`
        }
      }
    })
  ])
  .then(function(results) {
    //Sets up pagination link info by calculating how many pages are necessary
    //(i.e. ten per page)
    let pages = Math.ceil(results[1]/10);
    let pageArr = [];
    for(let i = 0; i < pages; i++)
      pageArr.push(i);
    res.render('patrons', {
          patrons: results[0],
          title: `Patrons Based On the ${formatCategory(category)} Search: "${req.body.query}"`,
          pages: pageArr,
          activePage: parseInt(req.params.id),
          count: results[1],
          route: 'search',
          categories: categories,
          category: category,
          query: query
    });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* GET patron details. */
router.get('/detail/:id', function(req, res, next) {
  //Finds particular patron info based on loan search for patron id, including related book and patron info
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
      patron_id: req.params.id
    }
  }).then(function(loans) {
    let patrons = loans.map(function(loan) {
      return loan.Patron;
    });
    let books = loans.map(function(loan) {
      return loan.Book;
    });
    if(patrons.length > 0)
      return res.render('patrons/detail', {
                            books: books,
                            loans: loans,
                            patrons: patrons,
                            patron: patrons[0],
                            title: `Patron: ${patrons[0].first_name} ${patrons[0].last_name}`
      });
    else
      //if patron has no loan history, finds patron info directly through patron id.
      Patron.findAll({
        where: {
          id: req.params.id
        }
      }).then(function(patrons) {
          patrons = patrons;
          res.render('patrons/detail', {
                                books: books,
                                loans: loans,
                                patrons: patrons,
                                patron: patrons[0],
                                title: `Patron: ${patrons[0].first_name} ${patrons[0].last_name}`
          });
      }).catch(function(error) {
          res.render('error', { title: 'Error', error: error });
      });
  }).catch(function(error) {
      res.render('error', { title: 'Error', error: error });
  });
});

/* POST update patron. */
router.post('/update/:id', function(req, res, next) {
  //Updates patron's info based on form input
  Patron
    .update(req.body, {
      where: {
        id: req.params.id
      }
    })
    .then(function() {
      return res.redirect('/patrons/list/0');
    })
    .catch(function(error) {
      //If validation errors, errors are displayed to user, patron info and loan history are repopulated,
      //and errors are displayed to user with instructures to correct them before submitting.
      if(error.name === "SequelizeValidationError" || error.name === 'SequelizeUniqueConstraintError') {
        let errorMsgs;
        if(error.name === 'SequelizeUniqueConstraintError')
          errorMsgs = [{ message: 'You must input a unique ID into the "Library ID" field.' }];
        else
          errorMsgs = error.errors;
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
            patron_id: req.params.id
          }
        }).then(function(loans) {
          let patrons = loans.map(function(loan) {
            return loan.Patron;
          });
          let books = loans.map(function(loan) {
            return loan.Book;
          });
          if(patrons.length > 0)
            return res.render('patrons/detail', {
                patron: req.body,
                patrons: patrons,
                loans: loans,
                title: `Patron: ${patrons[0].first_name} ${patrons[0].last_name}`,
                errors: errorMsgs
            });
          else
            //Again, info is first obtained through loan, if loans for partiular patron exist. Otherwise,
            //Patron info is obtained directly by patron id.
            Patron.findAll({
              where: {
                id: req.params.id
              }
            }).then(function(patrons) {
                return res.render('patrons/detail', {
                    patron: req.body,
                    loans: loans,
                    patrons: patrons,
                    title: `Patron: ${patrons[0].first_name} ${patrons[0].last_name}`,
                    errors: errorMsgs
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

/* GET new patron creation page. */
router.get('/new', function(req, res, next) {
  res.render('patrons/new', {
      patron: {},
      title: 'New Patron'
  });
});

/* POST create new patron. */
router.post('/new', function(req, res, next) {
  //Creates new patron based on form input
  Patron
    .create(req.body)
    .then(function() {
      res.redirect('/patrons/list/0');
    })
    .catch(function(error) {
      //If validation errors, user is directed to fix errors before submitting.
      if(error.name === "SequelizeValidationError")
        res.render('patrons/new', {
            patron: req.body,
            title: 'New Patron',
            errors: error.errors
        });
      else if(error.name === 'SequelizeUniqueConstraintError')
        //If user attempts to create new user with a library_id that already exists, displays error and directs
        //user to input a unique library id.
        res.render('patrons/new', {
            patron: req.body,
            title: 'New Patron',
            errors: [{ message: 'You must input a unique id into the "Library ID" field.'}]
        });
      else
        throw error;
    })
    .catch(function(error) {
        res.render('error', { title: 'Error', error: error });
    });
});

module.exports = router;
