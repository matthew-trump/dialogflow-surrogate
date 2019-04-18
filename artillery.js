router.get('/artillery/remote', function (req, res) {
    const path = './artillery/remote.json';
    const json = require(path);
    res.json(json);

})
router.get('/artillery/scripts/:projectId', function (req, res) {
    const path = './artillery/scripts/' + req.params.projectId;
    if (!fs.existsSync(path)) {
        res.json({ scripts: [] });
        return;
    }
    fs.readdir(path, function (err, items) {
        let scripts = [];
        if (items) {
            scripts = items.filter(item => { return item.endsWith('.json'); })
                .map(name => name.substr(0, name.length - 5));
        }
        res.json({ scripts: scripts });
    });
});

router.get('/artillery/script/:projectId/:id', function (req, res) {
    const path = './artillery/scripts/' + req.params.projectId + '/' + req.params.id + '.json';
    if (!fs.existsSync(path)) {
        res.json({ script: {} });
        return;
    }
    fs.readFile(path, 'utf8', function read(err, data) {
        if (err) {
            res.status(400).json({ err: err });
        }
        content = data;
        const json = JSON.parse(data);
        json.id = req.params.id;
        json.projectId = req.params.projectId;
        res.json(json);



    });
});

router.get('/artillery/yaml/:projectId/:id', function (req, res) {

    const yaml = getYaml(req);
    res.send(yml);

})

router.post('/artillery/output/:projectId/:id', function (req, res) {
    const projectId = req.params.projectId;
    const id = req.params.id;

    const meta = req.body.meta;
    const exec = req.body.exec;

    const dir = "./artillery/output/" + projectId;

    const host = meta.delegateId || meta.ipAddress;
    const time = meta.time;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
    const _path = dir + "/" + host + "-" + time;

    const execPath = _path + ".exec.json";
    const metaPath = _path + ".meta.json";
    fs.writeFile(execPath, exec, 'utf-8', (err) => {
        if (err) {
            console.log("ERROR" + err);
        } else {
            console.log("WROTE " + execPath);
        }
    });
    fs.writeFile(metaPath, JSON.stringify(meta), 'utf-8', (err) => {
        if (err) {
            console.log("ERROR" + err);
        } else {
            console.log("WROTE " + metaPath);
        }
    });
    res.json({});

})

router.get('/artillery/output/:projectId', function (req, res) {
    const projectId = req.params.projectId;

    const dir = "./artillery/output/" + projectId;

    if (!fs.existsSync(dir)) {
        res.json({ output: [] });
        return;
    }
    fs.readdir(dir, function (err, items) {
        let outputMeta = [];
        if (items) {
            metaFiles = items.filter(item => { return item.endsWith('.meta.json'); })
                .map(filename => {
                    const meta = require(dir + "/" + filename);
                    outputMeta.push(meta);
                });
        }
        res.json({ output: outputMeta });
    });

})

router.get('/artillery/output/:projectId/:time/:delegateId', function (req, res) {
    const projectId = req.params.projectId;
    const time = req.params.time;
    const delegateId = req.params.delegateId;


    const dir = "./artillery/output/" + projectId;




    if (!fs.existsSync(dir)) {
        res.json({ output: {} });
        return;
    }

    const file = delegateId + "-" + time + ".exec.json";
    const exec = require(dir + "/" + file);


    res.json(exec);


})