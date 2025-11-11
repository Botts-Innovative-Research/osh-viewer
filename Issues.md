## OSH JS Issues

1. web worker imports

    - instead of importing DataSourceWorker.worker.js, the import should happen as the worker is created

    ```
       console.log('Worker props ARGS', properties);

         let workerUrl;
         try {
             workerUrl = new URL('./worker/DataSource.worker.js', import.meta.url);
             console.log('Worker URL:', workerUrl);
         } catch (e) {
             console.error('Failed to create worker URL:', e);
         }

         const worker = new Worker(workerUrl, { type: 'module' });
         const extWorker = new WorkerExt(worker);
         console.log('Worker created:', extWorker);
         return extWorker;
    ```

    - Same for FFMPEG

    ```
     // this.decodeWorker = new DecodeWorker();
         let decodeWorkerUrl = new URL('./workers/ffmpeg.decode.video.worker.js', import.meta.url);

         this.decodeWorker = new Worker(decodeWorkerUrl, {type: 'module'});
    ```

2. import statements
    - there is an issue where an `assert` named function is imported, but it does not exist. This many not be the case in
      3.0.0
3. Cesium import
    - `  createDefaultImageryProviderViewModels,` doesn't exist in certain versions of Cesium and appears unused.
4. LeafletView unused 'assert' import
