import { useEffect, useState } from 'react';
import { httpServices } from './http.service';

const initForm = { project: "", subproject: "", path: "", runCommand: "" };

const ProjectSelector = () => {
  const [projects, setProjects] = useState({});
  const [selectedProject, setSelectedProject] = useState("");
  const [subProjects, setSubProjects] = useState({});
  const [selectedSub, setSelectedSub] = useState("");

  const [proForm, setProForm] = useState(initForm);
  const [isAddingProject, setIsAddingProject] = useState(false);


  const [showBrowse, setShowBrowse] = useState(false);
  const [folderList, setFolderList] = useState<any[]>([]);

  const toggleAddProject = () => {
    setIsAddingProject(!isAddingProject);
  };

  const cancelAddProject = () => {
    setIsAddingProject(false);
    setProForm(initForm);
  };

  const getProjects = async () => {
    try {
      const resp = await httpServices.getData('projects');
      setProjects(resp);
    } catch (err) {}
  }

  useEffect(() => {
    getProjects();
    getBrowserPaths();
  }, []);

  const onProjectSelect = (e: any) => {
    if(!e.target.value) return;
    setSelectedProject(e.target.value);
    setSelectedSub("");
    setSubProjects((projects as any)[e.target.value]);
  }

  const onSubProjectSelect = (e: any) => {
    if(!e.target.value) return;
    setSelectedSub(e.target.value);
  }

  const canMasterAct = () => !selectedProject || !selectedSub;

  const onFieldChange = (e: any) => {
    setProForm(pre => ({...pre, [e.target.name]: e.target.value}));
  }

  const browseRefClick = () => {
    setShowBrowse(true);
  }

  const getBrowserPaths = async (path: string = "") => {
    setFolderList([]);
    const bPaths: any = await httpServices.getData(`browse?path=${encodeURIComponent(path)}`)

    if (bPaths.parent !== bPaths.current) {
      const parentItem = {name: '..', path: bPaths.parent};
      setFolderList(pre => ([ ...pre, parentItem ]))
    }

    bPaths.directories.forEach((dir: any) => {
        const item = { name: dir.name, path: dir.path };
        setFolderList(pre => ([ ...pre, item ]));
    });

    setProForm(pre => ({...pre, path}));
  }

  const addNewProject = async () => {
    if (!!Object.values(proForm)?.filter(v => !v)?.length) return;

    await httpServices.postData('projects', proForm);
    setIsAddingProject(false);
    setProForm(initForm);
    await getProjects();
  };

  const openInVSCode = async () => {
    try {
      if(canMasterAct()) {
        showAlert('Please select both a project and a subproject', 'error');
        return;
      }
  
      const data: any = await httpServices.postData('open', { project: selectedProject, subproject: selectedSub });
      showAlert(data.message || data.error, data.error ? 'error' : 'success')
    } catch (err) {
      showAlert('An unexpected error occurred', 'error');
    }
  }

  function showAlert(message: string, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 p-4 rounded-lg text-white max-w-md ${
        type === 'error' ? 'bg-solarized-red' : 
        type === 'success' ? 'bg-solarized-green' : 
        'bg-solarized-blue'
    }`;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }

  const runProject = async () => {
    try {
      if(canMasterAct()) {
        showAlert('Please select both a project and a subproject', 'error');
        return;
      }
  
      const data: any = await httpServices.postData('run', { project: selectedProject, subproject: selectedSub });
      showAlert(`Project is running successfully`, 'success');
    } catch (error) {
      showAlert('An unexpected error occurred', 'error');
    }
  }

  const deleteProject = async () => {
    try {
      if(canMasterAct()) {
        showAlert('Please select both a project and a subproject', 'error');
        return;
      }

      const data: any = await httpServices.deleteData(`projects/${selectedProject}/${selectedSub}`);
      showAlert(data.message, 'success');
      setProjects({});
      setSelectedProject("");
      setSubProjects({});
      setSelectedSub("");
      
      await getProjects();
    } catch (error) {
      showAlert('An unexpected error occurred', 'error');
    }
  }

  return (
    <>
      <div className="bg-solarized-base02 rounded-lg shadow-xl p-6 w-[800px]">
        <h2 className="text-2xl font-bold mb-6 text-[#268bd2]">Project Selector</h2>

        <select id="projectSelect" className="w-full mb-4 bg-[#002b36] text-[#839496] rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#268bd2]" 
          onChange={onProjectSelect} value={selectedProject}
        >
          <option >Select project</option>
          {
            Object.keys(projects)?.map((val, i) => <option key={i} >{val}</option>)
          }
        </select>
        <select id="subprojectSelect" className="w-full mb-4 bg-[#002b36] text-[#839496] rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#268bd2]" 
          onChange={onSubProjectSelect} value={selectedSub}
        >
          <option >Select project</option>
          {
            Object.keys(subProjects)?.map((val, i) => <option key={i} >{val}</option>)
          }
        </select>

        <div className="flex space-x-2 mb-6">
          <button onClick={deleteProject} className="flex-1 bg-solarized-red hover:bg-opacity-80 text-[#fdf6e3] font-bold py-2 px-4 rounded transition duration-300">Delete</button>
          <button disabled={canMasterAct()} className="flex-1 bg-[#2aa198] hover:bg-opacity-80 text-[#fdf6e3] font-bold py-2 px-4 rounded transition duration-300">Edit</button>
          <button disabled={canMasterAct()} onClick={runProject} className="flex-1 bg-[#2aa198] hover:bg-opacity-80 text-[#fdf6e3] font-bold py-2 px-4 rounded transition duration-300">Run Project</button>
          <button disabled={canMasterAct()} onClick={openInVSCode} className="flex-1 bg-[#268bd2] hover:bg-opacity-80 text-[#fdf6e3] font-bold py-2 px-4 rounded transition duration-300">VS Code</button>
        </div>

        <button onClick={toggleAddProject} className="w-full bg-[#6c71c4] hover:bg-opacity-80 text-[#fdf6e3] font-bold py-2 px-4 rounded mb-4 transition duration-300">Add New Project</button>

        {
          isAddingProject && (
            <div id="addProjectForm" className="bg-[#002b36] rounded-lg p-4 mt-4">
              <h3 className="text-xl font-bold mb-4 text-[#b58900]">Add New Project</h3>
              <input onChange={onFieldChange} name="project" placeholder="Project Name" className="w-full mb-2 bg-solarized-base02 text-[#839496] rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#b58900]" />
              <input onChange={onFieldChange} name="subproject" placeholder="Subproject Name" className="w-full mb-2 bg-solarized-base02 text-[#839496] rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#b58900]" />
              <div className="flex mb-2">
                <input name="path" value={proForm.path} placeholder="Project Path" className="flex-grow bg-solarized-base02 text-[#839496] rounded-l p-2 focus:outline-none focus:ring-2 focus:ring-[#b58900]" readOnly />
                <button onClick={() => browseRefClick()} className="bg-[#268bd2] hover:bg-opacity-80 text-[#fdf6e3] font-bold py-2 px-4 rounded-r">Browse</button>
              </div>
              <input onChange={onFieldChange} name="runCommand" placeholder="Run Command" className="w-full mb-4 bg-solarized-base02 text-[#839496] rounded p-2 focus:outline-none focus:ring-2 focus:ring-[#b58900]" />
              <div className="flex justify-end">
                <button onClick={cancelAddProject} className="bg-[#dc322f] hover:bg-opacity-80 text-[#fdf6e3] font-bold py-2 px-4 rounded mr-2">Cancel</button>
                <button onClick={addNewProject} className="bg-[#cb4b16] hover:bg-opacity-80 text-[#fdf6e3] font-bold py-2 px-4 rounded transition duration-300">Save Project</button>
              </div>
            </div>
          )
        }
      </div>

      {
        showBrowse &&
        <div id="folderBrowserModal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-solarized-base02 rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 text-solarized-blue">Select Folder</h3>
                <div id="folderList" className="mb-4 max-h-60 overflow-y-auto">
                  {
                    folderList?.map((val, i) => {
                      return <div key={i} onClick={() => getBrowserPaths(val?.path)} className='py-2 px-4 hover:bg-solarized-base01 cursor-pointer'>{val?.name}</div>
                    })
                  }
                </div>
                <div className="flex justify-end">
                    <button onClick={() => setShowBrowse(false)} className="bg-solarized-red hover:bg-opacity-80 text-solarized-base03 font-bold py-2 px-4 rounded mr-2">Cancel</button>
                    <button onClick={() => setShowBrowse(false)} className="bg-solarized-green hover:bg-opacity-80 text-solarized-base03 font-bold py-2 px-4 rounded">Select</button>
                </div>
            </div>
        </div>
      }

    
    </>
  );
};

export default ProjectSelector;
