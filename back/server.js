const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('node-pty');

const app = express();
const port = 8177;

// Set the base path for your projects
const BASE_PROJECT_PATH = '/home/kamlesh/Documents';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const projectsFile = path.join(__dirname, 'projects.json');

async function readProjects() {
    try {
        const data = await fs.readFile(projectsFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading projects file:', error);
        return {};
    }
}

async function writeProjects(projects) {
    try {
        await fs.writeFile(projectsFile, JSON.stringify(projects, null, 2));
    } catch (error) {
        console.error('Error writing projects file:', error);
    }
}

app.get('/api/projects', async (req, res) => {
    const projects = await readProjects();
    res.json(projects);
});

app.post('/api/projects', async (req, res) => {
    const { project, subproject, path: projectPath, runCommand } = req.body;
    const projects = await readProjects();
    
    if (!projects[project]) {
        projects[project] = {};
    }
    
    projects[project][subproject] = { path: projectPath, runCommand };
    
    await writeProjects(projects);
    res.json({ message: 'Project added successfully' });
});

app.delete('/api/projects/:project/:subproject', async (req, res) => {
    const { project, subproject } = req.params;
    const projects = await readProjects();
    
    console.log(projects[project]);

    if(Object.keys(projects[project])?.length > 1) {
        delete projects[project][subproject];
    } else {
        delete projects[project];
    }
    
    await writeProjects(projects);
    res.json({ message: 'Project added successfully' });
});

app.post('/api/run', async (req, res) => {
    const { project, subproject } = req.body;
    const projects = await readProjects();
    const projectInfo = projects[project]?.[subproject];
    
    if (!projectInfo) {
        return res.status(400).json({ error: 'Invalid project or subproject' });
    }

    const fullPath = path.join(BASE_PROJECT_PATH, projectInfo.path);
    
    // Construct the command to run in the new terminal
    const command = `
        gnome-terminal -- bash -c "
        source ~/.bashrc;
        export NVM_DIR=\\"$HOME/.nvm\\";
        [ -s \\"$NVM_DIR/nvm.sh\\" ] && \\. \\"$NVM_DIR/nvm.sh\\";
        cd '${fullPath}';
        echo 'Running command: ${projectInfo.runCommand}';
        ${projectInfo.runCommand};
        echo 'Command finished. Terminal will remain open.';
        exec bash;
        "
        `
    ;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).json({ 
                error: 'An error occurred while running the project',
                details: error.message,
                stdout: stdout,
                stderr: stderr
            });
        }
        res.json({ message: 'Project started in a new terminal window' });
    });
});

app.post('/api/open', async (req, res) => {
    const { project, subproject } = req.body;
    const projects = await readProjects();
    const projectInfo = projects[project]?.[subproject];
    
    if (!projectInfo) {
        return res.status(400).json({ error: 'Invalid project or subproject' });
    }

    const fullPath = path.join(BASE_PROJECT_PATH, projectInfo.path);
    
    exec(`code "${fullPath}"`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: error.message });
        }
        res.json({ message: 'VS Code opened' });
    });
});

app.get('/api/browse', async (req, res) => {
    const relPath = req.query.path || '';
    const fullPath = path.join(BASE_PROJECT_PATH, relPath);
    
    try {
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        const directories = items
            .filter(item => item.isDirectory())
            .map(item => ({
                name: item.name,
                path: path.join(relPath, item.name)
            }));
        
        res.json({
            current: relPath,
            parent: path.dirname(relPath),
            directories: directories
        });
    } catch (error) {
        res.status(500).json({ error: 'Unable to read directory', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});