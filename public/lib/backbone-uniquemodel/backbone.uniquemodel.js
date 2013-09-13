/*jshint unused:true, undef:true, strict:true*/
/*global global, _, Backbone*/
(function (window) {
  "use strict";

  var globalCache = {};

  /**
   * UniqueModel wrapper converts regular Backbone models into
   * unique ones.
   *
   * Example:
   *   var UniqueUser = UniqueModel(User);
   *
   * If this is model is synced between windows, you need to
   * specify the model's name (string) and a valid storage adapter
   * (currently just 'localStorage').
   *
   * Example:
   *   var SyncedUniqueUser = UniqueModel(User, 'User', 'localStorage');
   */

  function UniqueModel(Model, modelName, storageAdapter) {
    modelName = modelName || _.uniqueId('UniqueModel_');
    storageAdapter = storageAdapter || UniqueModel.STORAGE_DEFAULT_ADAPTER;

    var cache = UniqueModel.addModel(Model, modelName, storageAdapter);

    return cache.modelConstructor;
  }

  UniqueModel.STORAGE_DEFAULT_ADAPTER = 'memory';
  UniqueModel.STORAGE_KEY_DELIMETER = '.';
  UniqueModel.STORAGE_NAMESPACE = 'UniqueModel';

  // Returns the cache associated with the given Model.
  UniqueModel.getModelCache = function (modelName) {
    var cache = globalCache[modelName];
    if (!cache)
      throw "Unrecognized model: " + modelName;

    return cache;
  };

  UniqueModel.addModel = function (Model, modelName, storageAdapter) {
    // Throw error here? (added twice)
    if (globalCache[modelName])
      return globalCache[modelName];

    var cache = new ModelCache(Model, modelName, storageAdapter);
    globalCache[modelName] = cache;
    return cache;
  };

  // Clears all in-memory instances
  UniqueModel.clear = function () {
    for (var modelName in globalCache) {
      if (globalCache.hasOwnProperty(modelName))
        delete globalCache[modelName];
    }
  };

  /*
   * Encapsulates a cache for a single model.
   */

  function ModelCache (Model, modelName, storageAdapter) {
    var self = this;

    this.instances = {};
    this.Model = Model;
    this.modelName = modelName;

    this.storage = null;
    if (storageAdapter === 'localStorage') {
      this.storage = new LocalStorageAdapter(this.modelName);
    }

    if (this.storage) {
      this.storage.on('sync', this.storageSync, this);
      this.storage.on('destroy', this.storageDestroy, this);
    }

    var modelConstructor = function (attrs, options) {
      return self.get(attrs, options);
    };
    _.extend(modelConstructor, Backbone.Events);

    // Backbone collections need prototype of wrapped class
    modelConstructor.prototype = this.Model.prototype;
    this.modelConstructor = modelConstructor;
  }

  _.extend(ModelCache.prototype, {

    newModel: function (attrs, options) {
      var instance = new this.Model(attrs, options);

      if (this.storage) {
        if (instance.id)
          this.storage.save(instance.id, instance.attributes);

        instance.on('sync', this.instanceSync, this);
        instance.on('destroy', this.instanceDestroy, this);
      }

      return instance;
    },

    // Event handler when 'sync' is triggered on an instance
    instanceSync: function (instance) {
      if (this.storage)
        this.storage.save(instance.id, instance.attributes);
    },

    // Event handler when 'destroy' is triggered on an instance
    instanceDestroy: function (instance) {
      if (this.storage)
        this.storage.remove(instance.id);
    },

    // Event handler when 'sync' is triggered on the storage adapter
    storageSync: function (id, attrs) {
      this.get(attrs, { fromStorage: true });
    },

    // Event handler when 'destroy' is triggered on the storage handler
    storageDestroy: function (id) {
      var instance = this.instances[id];
      if (instance) {
        instance.trigger('destroy', instance);
        delete this.instances[id];
      }
    },

    add: function (id, attrs, options) {
      var instance = this.newModel(attrs, options);
      this.instances[id] = instance;

      return instance;
    },

    get: function (attrs, options) {
      options = options || {};
      var Model = this.Model;
      var id = attrs && attrs[Model.prototype.idAttribute];

      // If there's no ID, this model isn't being tracked; return
      // a new instance
      if (!id)
        return this.newModel(attrs, options);

      // Attempt to restore a cached instance
      var instance = this.instances[id];
      if (!instance) {
        // If we haven't seen this instance before, start caching it
        instance = this.add(id, attrs, options);
        if (options.fromStorage)
          this.modelConstructor.trigger('uniquemodel.add', instance);
      } else {
        // Otherwise update the attributes of the cached instance
        instance.set(attrs);
        if (!options.fromStorage)
          this.instanceSync(instance);
      }
      return instance;
    }
  });

  /**
   * Wraps localStorage access and onstorage events. Designed
   * so that this can be swapped out for another adapter (i.e.
   * sessionStorage or a localStorage-backed library like lscache)
   */
  function LocalStorageAdapter (modelName) {
    this.modelName = modelName;

    LocalStorageAdapter.instances[modelName] = this;

    // Global listener - only listen once
    if (!LocalStorageAdapter.listener) {
      LocalStorageAdapter.listener = window.addEventListener ?
        window.addEventListener('storage', LocalStorageAdapter.onStorage, false) :
        window.attachEvent('onstorage', LocalStorageAdapter.onStorage);
    }
  }

  // Hash of LocalStorageAdapter instances
  LocalStorageAdapter.instances = {};

  // Reference to the global onstorage handler
  LocalStorageAdapter.listener = null;

  LocalStorageAdapter.onStorage = function (evt) {
    // TODO: IE fires onstorage even in the window that fired the
    //       change. Deal with that somehow.
    var key = evt.key;

    // This will process *all* storage events, so make sure not to choke
    // on events we're not interested in.

    // Example regex output: /UniqueModel\.(\w+)\.(.+)/
    var re = new RegExp([
      UniqueModel.STORAGE_NAMESPACE, // namespace (default is UniqueModel)
      '(\\w+)',                      // class name
      '(.+)'                         // key
    ].join('\\' + UniqueModel.STORAGE_KEY_DELIMETER));

    var match = key.match(re);
    if (!match)
      return;

    var modelName = match[1];
    var id = match[2];

    var adapter = LocalStorageAdapter.instances[modelName];
    if (!adapter)
      return;

    adapter.handleStorageEvent(key, id);
  };

  _.extend(LocalStorageAdapter.prototype, {
    handleStorageEvent: function (key, id) {
      var json = localStorage.getItem(key);
      if (!json)
        this.trigger('destroy', id);
      else
        this.trigger('sync', id, JSON.parse(json));
    },

    getStorageKey: function (id) {
      // e.g. UniqueModel.User.12345
      var str = [
        UniqueModel.STORAGE_NAMESPACE,
        this.modelName,
        id
      ].join(UniqueModel.STORAGE_KEY_DELIMETER);

      return str;
    },

    save: function (id, attrs) {
      if (!id)
        throw 'Cannot save without id';

      var json = JSON.stringify(attrs);
      localStorage.setItem(this.getStorageKey(id), json);
    },

    remove: function (id) {
      if (!id)
        throw 'Cannot remove without id';

      localStorage.removeItem(this.getStorageKey(id));
    }
  }, Backbone.Events);

  // Exports
  _.extend(UniqueModel, {
    ModelCache: ModelCache,
    LocalStorageAdapter: LocalStorageAdapter
  });

  window.Backbone.UniqueModel = UniqueModel;

})(typeof global === "object" ? global : this);
