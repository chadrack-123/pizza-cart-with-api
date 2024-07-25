document.addEventListener("alpine:init", () => {
    Alpine.data('pizzaCart', () => {
        return {
            header: "Perfect Pizza",
            title: "Shopping Cart",
            pizzas: [],
            username: '',
            cardId: '',
            cartPizzas: [],
            cartTotal: 0.00,
            paymentAmount: 0,
            message: '',
            ErrorMessage: '',
            featuredPizzas: [],
            historicalOrders: [],
            showHistoricalOrders: false,
            showHistoricalOrdersButton: false,
            isUserLoggedIn: false,
            loginfield: true,
            HideCartEmpty: true,
            history: [],
            HistCart: true,
            showHistoricalCart: true,
            showMainContent: false,
            LoginState: true,

            login() {
                if (this.username.length > 3) {
                    localStorage['username'] = this.username;
                    this.isUserLoggedIn = true;
                    this.loginfield = false;
                    this.showHistoricalOrdersButton = false;
                    this.showHistoricalOrders = false;
                    this.LoginState = false;
                    this.showMainContent = true;
                    this.fetchCart();
                    this.createCart();
                } else {
                    alert("Username is too short");
                }
            },

            logout() {
                if (confirm('Do you want to logout?')) {
                    this.username = '';
                    this.cardId = '';
                    this.isUserLoggedIn = false;
                    this.loginfield = true;
                    this.showHistoricalOrdersButton = false;
                    this.showHistoricalOrders = false;
                    this.historicalOrders = [];
                    this.featuredPizzas = [];
                    this.history = [];
                    localStorage['cardId'] = '';
                    this.LoginState = true;
                    this.showMainContent = false;
                }
            },

            createCart() {
                if (!this.username) {
                    return Promise.resolve();
                }
                const cardId = localStorage['cardId'];
                if (cardId) {
                    this.cardId = cardId;
                    return Promise.resolve();
                } else {
                    const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
                    return axios.get(createCartURL).then(result => {
                        this.cardId = result.data.cart_code;
                        localStorage['cardId'] = this.cardId;
                    });
                }
            },

            featuredGet() {
                const featuredURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`;
                return axios.get(featuredURL);
            },

            fetchCart() {
                axios.get(`https://pizza-api.projectcodex.net/api/pizza-cart/username/${this.username}`)
                    .then((res) => {
                        const carts = res.data;
                        carts.forEach((cart) => {
                            if (cart.status === 'paid') {
                                const cardCode = cart.cart_code;
                                axios.get(`https://pizza-api.projectcodex.net/api/pizza-cart/${cardCode}/get`)
                                    .then((res) => {
                                        const cartData = res.data;
                                        this.history.push(cartData);
                                    });
                            }
                        });
                    });
            },

            getCart() {
                const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cardId}/get`;
                return axios.get(getCartURL);
            },

            showCartData() {
                this.getCart().then(result => {
                    const cartData = result.data;
                    this.cartPizzas = cartData.pizzas;
                    this.cartTotal = cartData.total.toFixed(2);
                });
            },

            addPizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/add', {
                    "cart_code": this.cardId,
                    "pizza_id": pizzaId
                }).then(() => true).catch(err => {
                    console.log(err);
                });
            },

            RemovePizza(pizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/remove', {
                    "cart_code": this.cardId,
                    "pizza_id": pizzaId
                });
            },

            pay(amount) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizza-cart/pay', {
                    "cart_code": this.cardId,
                    amount
                });
            },

            init() {
                const storedUsername = localStorage['username'];
                if (storedUsername) {
                    this.username = storedUsername;
                }

                axios.get('https://pizza-api.projectcodex.net/api/pizzas')
                    .then(result => {
                        this.pizzas = result.data.pizzas;
                    });

                if (!this.cardId) {
                    this.createCart().then(() => {
                        this.showCartData();
                    });
                    this.featuredGet().then(res => {
                        this.featuredPizzas = res.data.pizzas;
                    });
                }
            },

            showFav() {
                this.featuredGet().then(res => {
                    this.featuredPizzas = res.data.pizzas;
                });
            },

            addfavorite(favPizzaId) {
                return axios.post('https://pizza-api.projectcodex.net/api/pizzas/featured', {
                    "username": this.username,
                    "pizza_id": favPizzaId
                }).then(() => {
                    this.showFav();
                });
            },

            addPizzaToCart(pizzaId) {
                this.addPizza(pizzaId)
                    .then(() => {
                        this.showCartData();
                        this.HideCartEmpty = true;
                    })
                    .catch(error => {
                        console.error('Error in addPizzaToCart:', error);
                    });
            },

            removePizzaFromCart(pizzaId) {
                this.RemovePizza(pizzaId).then(() => {
                    this.showCartData();
                });
            },

            HistoricalCart() {
                let order = {
                    pizzas: [...this.cartPizzas.map(pizza => ({
                        flavour: pizza.flavour,
                        price: pizza.price,
                        qty: pizza.qty
                    }))],
                    total: parseFloat(this.cartTotal),
                    date: new Date().toLocaleDateString()
                };
                this.historicalOrders.push(order);
            },

            payForCart() {
                this.pay(this.paymentAmount).then(result => {
                    if (this.paymentAmount == 0 && this.cartTotal === 0) {
                        this.ErrorMessage = "Your cart is cleared, check your receipt!";
                        setTimeout(() => this.ErrorMessage = '', 4000);
                    } else if (this.cartTotal == 0.00 && this.paymentAmount > 0) {
                        this.ErrorMessage = "Your cart is empty, add item so you can make payment!";
                        setTimeout(() => this.ErrorMessage = '', 4000);
                    } else if (result.data.status == 'failure' && this.paymentAmount > 0) {
                        this.ErrorMessage = result.data.message + " Sorry - that is not enough money!";
                        setTimeout(() => this.ErrorMessage = '', 4000);
                    } else if (this.cartTotal > 0.00 && this.paymentAmount > this.cartTotal) {
                        const change = this.paymentAmount - this.cartTotal;
                        this.message = `Payment received, but you have change of : R${change.toFixed(2)} Enjoy your Pizzas!`;
                        this.HistoricalCart();
                        setTimeout(() => {
                            this.message = '';
                            this.cartPizzas = [];
                            this.cartTotal = 0.00;
                            this.paymentAmount = 0;
                        }, 4000);
                        this.fetchCart();
                        this.showHistoricalOrdersButton = true;
                    } else if (result.data.status == "success" && this.paymentAmount === this.cartTotal) {
                        this.message = 'Payment received, Enjoy your Pizzas!';
                        this.HistoricalCart();
                        setTimeout(() => {
                            this.message = '';
                            this.cartPizzas = [];
                            this.cartTotal = 0.00;
                            this.paymentAmount = 0;
                        }, 4000);
                        this.fetchCart();
                        this.showHistoricalOrdersButton = true;
                    } else {
                        this.ErrorMessage = "Sorry - you have to put amount to pay!";
                        setTimeout(() => this.ErrorMessage = '', 4000);
                    }
                });
            },

            toggleFavorite(id) {
                const pizza = this.pizzas.find(p => p.id === id);
                if (pizza) {
                    pizza.isFavorite = !pizza.isFavorite;
                }
            },

            toggleHistoricalOrders() {
                this.showHistoricalOrders = !this.showHistoricalOrders;
            },

            CartButton() {
                this.HideCartEmpty = !this.HideCartEmpty;
            },

            HistoryCartButton() {
                this.HistCart = !this.HistCart;
            }
        }
    })
})
