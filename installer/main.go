package main

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
)

type Config struct {
	Windows struct {
		TexLiveURL string `json:"texlive_url"`
		NodeURL    string `json:"node_url"`
	} `json:"windows"`
}

func main() {
	// Read the config.json file
	config := loadConfig("config.json")

	// Check which operating system is running
	platform := runtime.GOOS
	switch platform {
	case "windows":
		installWindows(config)
		break
	case "darwin":
		installDarwin(config)
		break
	case "linux":
		installLinux(config)
		break
	default:
		fmt.Println("This operating system is not supported yet: " + platform)
		break
	}
}

func installWindows(config Config) {
	// Check if pdflatex is installed
	if !isPdflatexInstalled() {
		fmt.Println("pdflatex is not installed. Installing...")
		installTexLiveWindows(config)
		fmt.Println("Hopefully pdflatex is installed now. If not, please install it manually.")
	}

	// Check if nodejs is installed
	if !isNodeInstalled() {
		fmt.Println("nodejs is not installed. Installing...")
		ensureAdmin()
		installNodeWindows(config)
		fmt.Println("Hopefully nodejs is installed now. If not, please install it manually.")
	}
}

func installDarwin(config Config) {
	fmt.Println("This operating system is not supported yet.")
}

func installLinux(config Config) {
	fmt.Println("This operating system is not supported yet.")
}

func isPdflatexInstalled() bool {
	cmd := exec.Command("pdflatex", "--version")
	if err := cmd.Run(); err != nil {
		return false
	}
	return true
}

func isNodeInstalled() bool {
	cmd := exec.Command("node", "--version")
	if err := cmd.Run(); err != nil {
		return false
	}
	return true
}

func installTexLiveWindows(config Config) {
	// Download the installer zip file
	fmt.Println("Downloading the installer zip file...")
	tmpFolder := os.TempDir()
	absDir := filepath.Join(tmpFolder, "install-tl.zip")
	downloadFile(absDir, config.Windows.TexLiveURL)

	// Unzip the installer zip file on windows
	fmt.Println("Unzipping the installer zip file...")
	dest := filepath.Join(tmpFolder, "install-tl")
	unzipFile(absDir, dest)

	// Run the installer
	fmt.Println("Running the installer...")
	// Search for the install-tl-xxxxxx folder
	var installFolder string
	files, err := os.ReadDir(filepath.Join(tmpFolder, "install-tl"))
	if err != nil {
		log.Fatal(err)
	}
	for _, file := range files {
		if strings.HasPrefix(file.Name(), "install-tl-") {
			installFolder = file.Name()
			break
		}
	}

	// Run the installer
	cmd := exec.Command(filepath.Join(tmpFolder, "install-tl", installFolder, "install-tl-windows.bat"), "-no-gui", "-non-admin", "-no-cls", "--no-interaction", "-scheme", "scheme-basic")
	cmd.Dir = filepath.Join(tmpFolder, "install-tl", installFolder)
	cmd.Stdout = os.Stdout // Add this line
	cmd.Stderr = os.Stderr // Add this line

	if err := cmd.Run(); err != nil {
		log.Fatal(err)
	}

	// Remove the installer zip file
	fmt.Println("Removing the installer zip file...")
	if err := os.Remove(absDir); err != nil {
		log.Fatal(err)
	}

	// Remove the installer folder
	fmt.Println("Removing the installer folder...")
	if err := os.RemoveAll(filepath.Join(tmpFolder, installFolder)); err != nil {
		log.Fatal(err)
	}
}

func installNodeWindows(config Config) error {
	// Download the installer
	fmt.Println("Downloading Node.js installer...")
	tmpFolder := os.TempDir()
	absPath := filepath.Join(tmpFolder, "node-installer.msi")
	err := downloadFile(absPath, config.Windows.NodeURL)
	if err != nil {
		return err
	}

	// Run the installer
	fmt.Println("Running Node.js installer...")
	cmd := exec.Command("msiexec", "/i", absPath, "/quiet", "/norestart")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err = cmd.Run()
	if err != nil {
		return err
	}

	// Remove the installer
	fmt.Println("Removing Node.js installer...")
	err = os.Remove(absPath)
	if err != nil {
		return err
	}

	fmt.Println("Node.js installed successfully.")
	return nil
}

func loadConfig(file string) Config {
	var config Config
	configFile, err := os.Open(file)
	defer configFile.Close()
	if err != nil {
		fmt.Println(err.Error())
	}
	jsonParser := json.NewDecoder(configFile)
	jsonParser.Decode(&config)
	return config
}

func downloadFile(filepath string, url string) error {
	// Create the file
	out, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer out.Close()

	// Download the file
	fmt.Println("Downloading the file...")
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	// Write the body to file
	_, err = io.Copy(out, resp.Body)
	if err != nil {
		return err
	}
	return nil
}

func unzipFile(src string, dest string) error {
	r, err := zip.OpenReader(src)
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		rc, err := f.Open()
		if err != nil {
			return err
		}
		defer rc.Close()

		fpath := filepath.Join(dest, f.Name)
		if f.FileInfo().IsDir() {
			os.MkdirAll(fpath, os.ModePerm)
		} else {
			var fdir string
			if lastIndex := strings.LastIndex(fpath, string(os.PathSeparator)); lastIndex > -1 {
				fdir = fpath[:lastIndex]
			}

			err = os.MkdirAll(fdir, os.ModePerm)
			if err != nil {
				log.Fatal(err)
				return err
			}
			f, err := os.OpenFile(
				fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
			if err != nil {
				return err
			}
			defer f.Close()

			_, err = io.Copy(f, rc)
			if err != nil {
				return err
			}
		}
	}
	return nil
}

func ensureAdmin() {
	if !isAdmin() {
		// If not, restart the program with admin privileges
		fmt.Println("Restarting with admin privileges...")
		cmd := exec.Command(os.Args[0])
		cmd.SysProcAttr = &syscall.SysProcAttr{CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP | 0x08000000} // 0x08000000 is the CREATE_NEW_PROCESS_GROUP flag
		cmd.Start()
		return
	}
}

func isAdmin() bool {
	_, err := os.Open("\\\\.\\PHYSICALDRIVE0")
	if err != nil {
		fmt.Println("Admin rights are needed to continue.")
		return false
	}
	return true
}
