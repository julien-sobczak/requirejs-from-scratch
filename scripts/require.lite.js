/** 
 * see: http://github.com/jrburke/requirejs for details
 */

var require, define;

(function () {
    var    
        // Tous les modules définis (ceux à l'aide la function define)
        defQueue = [], // Tableau de tableaux [id, deps, factory]

        baseUrl,

        registry = {}, // id: Module
        requireCounter = 1;
        
    
    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {String} id the name of the module.
     * @param {Object} url the URL to the module.
     */
    function load(id, url) {
        var head = document.getElementsByTagName('head')[0];
        
        var node = document.createElement('script');
        node.type = 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        node.addEventListener('load', function() { 
        	completeLoad(id); 
    	}, false);
        node.src = url;

        head.appendChild(node);

        return node;
    };
    
    /**
     * Complete a load event.
     * @param {String} id the id of the module to potentially complete.
     */
    function completeLoad(id) {
    	/*
    	 * On itère parmi les modules (define) qui se sont enregistés.
    	 * Si on trouve un module sans id ou avec celui recherché, on procède à son initialisation.
    	 */
    	
    	
        var found, args, module;
        
        while (!found && defQueue.length) {
            args = defQueue.shift();
            if (args[0] === null) {
                args[0] = id;
                found = true;
            } else if (args[0] === id) {
                // Found matching define call for this script!
                found = true;
            }

            if (found) {
            	module = registry[args[0]];
            	module.init(args[1], args[2]);
            }
        }
    };

    
    function Module(id) {
    	this.id = id;
    	
    	this.events = {};
        this.depExports = []; // Résultat des dépendances
        this.depIds = [];
        this.depCount = 0;
        
    	// If no name, then it means it is a require call, generate an internal name.
        if (!this.id) {
        	this.id = '_@r' + (requireCounter += 1);
        }

        this.url = baseUrl + this.id + '.js';
    };

    Module.prototype = {
    		
        init: function (depIds, factory, enabled) {
            if (this.inited) {
                return;
            }
            
            this.enabled = this.enabled || enabled;
            this.factory = factory;
            this.depIds = depIds || [];

            // Indique que ce module est en train d'être initialisé 
            this.inited = true;

            if (this.enabled) {
                this.enable();
            } 
        },

        
        /*
         * On charge le script associé au module.
         */
        load: function () {
        	if (this.fetched) {
                return;
            }
            this.fetched = true;
            
            load(this.id, this.url);
        },

        /*
         * Checks if the module is ready to define itself, and if so,
         * define it.
         */
        check: function () {
            if (!this.enabled) {
                return;
            }

            if (!this.inited) {
                this.load();
            } else {
            	this.define();
	        }
        },

        /*
         * Si toutes les dépendances sont chargées, on appelle enfin la factory (ou l'objet).
         * On termine en annonçant qu'on est chargé pour que les modules qui en dépendent tentent eux aussi de se définir. 
         */
        define: function() {
    	   var id = this.id,
               depExports = this.depExports,
               exports = this.exports,
               factory = this.factory;
        	
        	if (this.depCount < 1 && !this.defined) {
    			if (typeof factory === "function") {
            	 	factory.apply(exports, depExports);
                } else {
                    // Just a literal value
                    exports = factory;
                }

                this.exports = exports;

	            this.defined = true;
	            this.emit('defined', this.exports);
            }
        },

        /*
         * On demande l'activation du module.
         * Pour chaque dépendance inconnue, on créé un nouveau module et on écoute sa définition.
         * Pour chaque dépendance, on demande son activation.
         * On termine en tenant notre activation.
         */
        enable: function () {
            this.enabled = true;

            // Enable each dependency
            var module = this;
            this.depIds.forEach(function (id, i) {
                var mod;

                if (!registry[id]) {
                    mod = new Module(id);
                    registry[id] = mod;
                    
                    module.depCount += 1;

                    mod.on('defined', function (depExports) {
                    	module.depCount -= 1;
                    	module.depExports[i] = depExports;
                    	module.check();
                    });
                }

                mod = registry[id];

                if (!mod.enabled) {
                    mod.enable();
                }
            });

            this.check();
        },

        /*
         * Enregistrement d'un Observer.
         */
        on: function (name, callback) {
            var callbacks = this.events[name];
            if (!callbacks) {
            	callbacks = this.events[name] = [];
            }
            callbacks.push(callback);
        },

        /*
         * On notifie chaque listener de l'événement (ici, le seul événement est 'defined') 
         */
        emit: function (name, evt) {
            (this.events[name] || []).forEach(function (callback) {
            	callback(evt);
            });
        }
    };


    /**
     * Main entry point.
     *
     * The first argument is an array of dependency string names to fetch. 
     * An optional function callback can be specified to execute when all of those dependencies are available.
     */
    require = function (deps, factory) {
    	var module = new Module();
        module.init(deps, factory, true);
    };

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (id, deps, factory) {
        // Allow for anonymous modules
        if (typeof id !== 'string') {
            // Adjust args appropriately
        	factory = deps;
            deps = id;
            id = null;
        }

        // This module may not have dependencies
        if (!Array.isArray(deps)) {
        	factory = deps;
            deps = null;
        }

        defQueue.push([id, deps, factory]);
    };

    
    /**
     * Look for a data-main script attribute, which could also adjust the baseUrl.
     */ 
    $('script[data-main]').each(function () {

        var dataMain = this.getAttribute('data-main');
        var src = dataMain.split('/');
        var mainScript = src.pop();
        
        baseUrl = src.join('/')  + '/';

        require([mainScript]);
    });
    
    
}());
